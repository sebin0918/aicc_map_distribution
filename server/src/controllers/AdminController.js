const pool = require('../config/database');

const getAdminData = async (req, res) => {

  // 불러오는값 쿼리 실제 칼럼 변수
  // uk_email = 이메일 
  
  try {
    // tb_user_key와 tb_user_information 데이터를 조인하여 가져오는 쿼리
    const result = await pool.query(`
      SELECT 
          uk.user_id AS "User ID",
          ui.ui_name AS "이름",
          uk.uk_email AS "Email",
          ui.ui_birth_date AS "생년월일",
          ui.ui_sex AS "성별",
          uk.uk_permission AS "사용자권한",
          ui.ui_phone_number AS "모바일"
      FROM 
          tb_user_key uk
      JOIN 
          tb_user_information ui
      ON 
          uk.user_id = ui.user_id
    `);
    
    console.log('Query Result:', result); // 쿼리 결과를 로그로 출력하여 확인

    if (result.length === 0) {
      return res.status(404).json({ error: 'Admin data not found' });
    }

    res.json({ data: result }); // 응답 데이터를 객체로 감쌈 
  } catch (error) {
    console.log('Error fetching Admin data : ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAdminData,
};

