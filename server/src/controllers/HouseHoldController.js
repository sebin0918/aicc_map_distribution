const pool = require('../config/database');

const getHouseHoldData = async (req, res) => {
  try {
    // user_id가 1인 사용자의 tb_received_paid 데이터를 가져오는 쿼리
    const result = await pool.query(`
      SELECT rp.rp_date, rp.rp_amount, rp.rp_detail, rp.rp_part
      FROM tb_received_paid rp
      WHERE rp.user_id = 1;
    `);
    
    console.log('Query Result:', result); // 쿼리 결과를 로그로 출력하여 확인

    if (result.length === 0) {
      return res.status(404).json({ error: 'HouseHold data not found' });
    }

    res.json({ data: result }); // 응답 데이터를 객체로 감쌈 
  } catch (error) {
    console.log('Error fetching HouseHold data : ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
module.exports = {
  getHouseHoldData,
};

