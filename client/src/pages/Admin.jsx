import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import { useNavigate, Link } from 'react-router-dom'; 
import login_logo from '../images/map_logo_login.png'; 
import signInButton from '../images/login_page_button.png'; 
import '../styles/Admin.css'; // CSS 파일을 임포트합니다.
import adminlogo from '../images/map_logo_login.png';

const Admin = () => {
  const [users, setUsers] = useState([]); // 서버에서 가져온 데이터를 저장할 state
  const [loading, setLoading] = useState(true); // 로딩 상태를 관리할 state
  const [error, setError] = useState(null); // 에러를 저장할 state

  useEffect(() => {
    // 데이터 가져오는 함수 정의
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/Admin'); // 백엔드의 엔드포인트 호출
        setUsers(response.data.data); // 서버로부터 데이터를 받아와 state에 저장
        setLoading(false); // 데이터 로딩 완료
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
        setLoading(false); // 에러 발생 시에도 로딩 완료 처리
      }
    };

    fetchData(); // 컴포넌트 마운트 시 데이터 가져오기
  }, []);

  const handleWarning = (id) => {
    console.log(`경고: User ID ${id}`);
    // 추가적인 경고 처리 로직을 작성할 수 있습니다.
  };

  const handleDelete = (id) => {
    console.log(`삭제: User ID ${id}`);
    // 추가적인 삭제 처리 로직을 작성할 수 있습니다.
  };

  if (loading) {
    return <div>Loading...</div>; // 로딩 중일 때 보여줄 화면
  }

  if (error) {
    return <div>{error}</div>; // 에러가 발생했을 때 보여줄 화면
  }

  return (
    <div id="admin_body">
      <div className="admin-panel">
        <div className="admin-header">
          <img src={adminlogo} alt="Logo" className="admin-logo" />
          <p>사용자 관리</p>
          <button className="admin-logout-button">Log Out</button>
        </div>

        <table className="admin-user-table">
          <thead className="admin-maintext">
            <tr>
              <th>접속</th>
              <th>User ID</th>
              <th>이름</th>
              <th>Email</th>
              <th>생년월일</th>
              <th>성별</th>
              <th>사용자권한</th>
              <th>모바일</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>
                  <span className={`status-dot ${user.status === 'online' ? 'online' : 'offline'}`}></span>
                </td>
                <td>{user.user_id}</td>
                <td>{user.이름}</td>
                <td>{user.Email}</td>
                <td>{user.생년월일}</td>
                <td>{user.성별}</td>
                <td>{user.사용자권한}</td>
                <td>{user.모바일}</td>
                <td>
                  <button className="warning-button" onClick={() => handleWarning(user.user_id)}>경고</button>
                </td>
                <td>
                  <button className="delete-button" onClick={() => handleDelete(user.user_id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
