const path = require('path');  // 경로 조작을 위한 모듈
const pool = require('../config/database'); // 데이터베이스 연결 모듈 가져오기
const { spawn } = require('child_process');

// POST 처리 함수
const postChatbotData = async (req, res) => {
  const { message } = req.body;
  const user_id = req.session.userId;

  try {
    // 첫 번째 INSERT: 기본 데이터 저장
    await pool.query(`
      INSERT INTO tb_chat_bot (user_id, cb_text, cb_query, cb_division)
      VALUES (?, ?, ?, ?);
    `, [user_id, message, null, 1]);

    // -- return query --
    // 경로 설정
    const returnQueryPath = path.join(__dirname, '../algorithm/script/return_query.py');
    
    // 가상환경
    const envName = 'stock2';  // 가상환경 이름

    // Python 실행
    const return_query = spawn('conda', ['run', '-n', envName, 'python', returnQueryPath, message, user_id]);
    
    let return_query_data = '';
    let return_query_error = '';

    // Python 출력 수신
    return_query.stdout.on('data', (data) => {
      return_query_data += data.toString();
      console.log('Python Output:', return_query_data);
    });
    
    // Python 에러 출력 수신
    return_query.stderr.on('data', (error) => {
      return_query_error += error.toString();
      console.error('Python Error:', return_query_error);
    });

    // Python 스크립트가 종료된 후 데이터베이스 쿼리 수행
    return_query.on('close', async (code) => {
      try {
        console.log(`Python script finished with code ${code}`);

        if (return_query_data.trim() === 'None' || return_query_data.trim() === '') {
          res.json({ data: `입력된 내용 : ${message}\n입력된 내용을 이해하지 못했습니다.\n줄임말이 있을 경우, 풀어서 작성해 주세요.` });
          await pool.query(`
            INSERT INTO tb_chat_bot (user_id, cb_text, cb_query, cb_division)
            VALUES (?, ?, ?, ?);
          `, [user_id, '잘못된 입력입니다. 다시 입력해주세요.', null, 0]);
          return; // 응답 후 종료
        }
          // Python에서 반환된 데이터를 분리하는 방법
          let sentence_key = return_query_data.substring(0,4);  // 첫 4자리 문자열 가져오기
          let query_data = return_query_data.substring(4);      // 나머지 SQL 쿼리 가져오기
          
          if (query_data === '' || query_data === 'None') {
          res.json({ data: '잘못된 입력입니다. 다시 입력해주세요.' });
          await pool.query(`
            INSERT INTO tb_chat_bot (user_id, cb_text, cb_query, cb_division)
            VALUES (?, ?, ?, ?);
          `, [user_id, '잘못된 입력입니다. 다시 입력해주세요.', null, 0]);
          return; // 응답 후 종료
        }

        // 데이터베이스 쿼리 수행
        const result = await pool.query(query_data); // SQL 쿼리 수행
        if (!result[0] || Object.keys(result[0]).length === 0) {
          res.json({ data: '잘못된 입력입니다. 다시 입력해주세요.' });
          await pool.query(`
            INSERT INTO tb_chat_bot (user_id, cb_text, cb_query, cb_division)
            VALUES (?, ?, ?, ?);
          `, [user_id, '잘못된 입력입니다. 다시 입력해주세요.', null, 0]);
          return; // 응답 후 종료
        } else {
          // -- sentence creation -- 
          // 경로 설정
          const sentenceCreationPath = path.join(__dirname, '../algorithm/script/sentence_creation.py');
          // result[0]이 유효할 때만 Python 스크립트 실행
          sentence_data = JSON.stringify(result[0])
          const sentence_creation = spawn('python', [sentenceCreationPath, sentence_data, sentence_key]);

          let sentence_creation_data = '';
          let sentence_creation_error = '';

          // Python 출력 수신
          sentence_creation.stdout.on('data', (data) => {
            sentence_creation_data += data.toString();
            console.log('sentence creation data test :', sentence_creation_data);
          });

          // Python 에러 수신
          sentence_creation.stderr.on('data', (error) => {
            sentence_creation_error += error.toString();
            console.error('Error from Python script:', sentence_creation_error);
          });

          // Python 스크립트가 종료된 후 데이터베이스에 INSERT
          sentence_creation.on('close', async (code) => {
            try {
              console.log(`Sentence creation script finished with code ${code}`);
              if (sentence_creation_error.trim() !== '') {
                res.status(500).json({ error: 'Failed to process data' });
                return; // 응답 후 종료
              }

              // 두 번째 INSERT: Python 스크립트 결과 저장
              await pool.query(`
                INSERT INTO tb_chat_bot (user_id, cb_text, cb_query, cb_division)
                VALUES (?, ?, ?, ?);
              `, [user_id, sentence_creation_data, query_data, 0]);

              // 응답 전송
              res.json({ data: sentence_creation_data });
              return;

            } catch (error) {
              console.error('Error inserting data into database:', error);
              res.status(500).json({ error: 'Internal server error' });
            }
          });

          // 에러 처리
          sentence_creation.on('error', (error) => {
            console.error('Error executing Python script:', error);
            res.status(500).json({ error: 'Failed to execute Python script' });
          });
        }
      } catch (error) {
        console.error('Error processing chatbot data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 에러 처리
    return_query.on('error', (error) => {
      console.error('Error executing Python script:', error);
      res.status(500).json({ error: 'Failed to execute Python script' });
    });
  } catch (error) {
    console.error('Error processing chatbot data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  postChatbotData, // 새로 추가한 POST 처리 함수 내보내기
};
