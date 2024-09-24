import React, { useEffect, useState } from "react";
import { Link }  from "react-router-dom";
import '../styles/SignUp.css';
import Footer from '../components/Footer';
import Signup_image from '../images/Signup_image_1.png'; // 이미지를 프로젝트에 맞게 경로를 설정해 주세요
import gendar_male from '../images/gendar_male_icon.png';
import gendar_female from '../images/gendar_female_icon.png';
import signup_logo from '../images/map_logo_login.png';
// import { redirect, Link } from "react-router-dom";


const SignUp = () => {
  
  const [checkEmail, setCheckEmail] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [codeButtonActivate, setCodeButtonActivate] = useState(true);
  const [confirmButtonActivate, setConfirmButtonActive] = useState(true);
  const [registerButtonActivate, setRegisterButtonActive] = useState(true);
  
  
  const emailHandle = (event) => {
    setCheckEmail(event.target.value);
  }


  const emailCheck = async () => {
    console.log(checkEmail);

    if (checkEmail.length > 0 && checkEmail.includes('@')) {
      try {
        const checkRes = await fetch(`${process.env.REACT_APP_API_URL}/api/register/useremail`, {
          method: 'POST',
          headers: {'content-type': 'application/json; charset=UTF-8'},
          credentials: 'include',
          body: JSON.stringify( {email: checkEmail} )
        });

        if (!checkRes.ok) {
          throw new Error('email중복확인 네트워크 응답실패');
        }

        const resData = await checkRes.json()
        console.log(resData.message);
  
        if (resData.message === 'email possible') {
          alert("가입가능한 이메일입니다.")
          setCodeButtonActivate(false);
        } else {
          alert("중복된 이메일입니다. 이메일을 다시 입력하세요.")
        }
      }
      catch(error) {
        console.error('email중복확인 비동기통신에러:', error);
      }
    } else {
      alert('올바른 이메일 형식이 아닙니다. 다시 확인해주세요.');
    }
  }


  const emailCode = async () => {
    console.log(checkEmail);

    try {
      const request = await fetch(`${process.env.REACT_APP_API_URL}/api/register/usercheckcode`, {
        method: 'POST',
        headers: {'content-type': 'application/json; charset=UTF-8'},
        credentials: 'include',
        body: JSON.stringify( {email: checkEmail} )
      });
      if (!request.ok) {
        throw new Error('인증코드 네트워크 응답실패');
      }
      
      alert(`인증코드가 ${checkEmail}로 발송되었습니다.`);
      setConfirmButtonActive(false);
    }
    catch(error) {
      console.error('인증코드 비동기통신에러:', error);
    }
  }


  const confirmCodeHandle = (event) => {
    setConfirmCode(event.target.value);
  }

  
  const confirmCodeChecking = async () => {
    console.log(confirmCode);
    
    try {
      const request = await fetch(`${process.env.REACT_APP_API_URL}/api/register/userconfirmcode`, {
        method: 'POST',
        headers: {'content-type': 'application/json; charset=UTF-8'},
        credentials: 'include', // 세션 쿠키 전송 설정 추가 
        body: JSON.stringify( {userconfirm: confirmCode} )
      });

      if (!request.ok) {
        throw new Error('인증코드확인 네트워크 응답실패');
      }
      
      const resData = await request.json()
      console.log(resData.message);

      if (resData.message === 'code possible') {
        alert("인증코드가 확인 되었습니다")
        setRegisterButtonActive(false);
      } else {
        alert("인증코드가 옳바르지 않습니다. 코드를 다시 확인해주세요.")
      }
    }
    catch(error) {
      console.error('인증코드 비동기통신에러:', error);
    }    
  }
  

  const RegisterId = async (event) => {
    event.preventDefault();  // 폼의 기본 제출동작 막기
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    if (data.user_sex === 'male') {
      data.user_sex = 0;
    } else {
      data.user_sex = 1;
    }
    console.log('FormData확인:', data);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register/userdata`, {
        method: 'POST',
        headers: {'content-type': 'application/json; charset=UTF-8'},
        credentials: 'include', 
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('네트워크 응답실패');
      }
      const resData = await response.json()
      if (resData.message === 'bad email') {
        alert('중복확인한 Email Id가 변경되었습니다. 다시 확인해주세요.');
      } else {
        console.log(resData);
        alert("회원가입 완료!");
        // redirect('/login');
        window.location.href = '/login';
      }        
    } catch(error) {
        console.error('비동기통신에러:', error);
        alert("회원가입 실패. 다시 시도해주세요.");
      }
  };


  return (
    <div className="signup-signup-page">
      <div className="signup-signup-container">
        <div className="signup-signup-illustration">
          <img src={Signup_image} alt="Sign Up" />
        </div>
        <div className="signup-signup-right">
          <div className="signup-signup-box">
            <Link to ="/">
            <img src={signup_logo} alt="MAP Logo" className="signup-logo" />
            </Link>
            <div className="signup-signup-form">
              <h2>Sign up into your account</h2>

              <form name="registerData" onSubmit={RegisterId}>
                <div className="signup-form-group">
                  <label><span>*</span>Name:</label>
                  <input type="text" name="user_name" placeholder="Enter your name." required />
                </div>
                <div className="signup-form-group">
                  <label><span>*</span>Gender:</label>
                  <div className="signup-gender-options">
                    <label>
                      <input type="radio" name="user_sex" value="male" />
                      <img src={gendar_male} alt="Male" style={{ width: '15px', height: '18px', marginRight: '5px' }} />
                      Male
                    </label>
                    <label>
                      <input type="radio" name="user_sex" value="female" />
                      <img src={gendar_female} alt="Female" style={{ width: '15px', height: '18px', marginRight: '5px' }} />
                      Female
                    </label>
                  </div>
                </div>
                <div className="signup-form-group">
                  <label><span>*</span>Email Id:</label>
                  <div className="signup-email-group">
                    <input type="email" name="user_email" placeholder="info@xyz.com" onChange={emailHandle} maxlength='50'/>
                    <button type="button" className="signup-email-check-status" onClick={emailCheck}>중복확인</button>
                  </div>
                  <p className="signup-email-availability"></p>
                </div>
                <div className="signup-form-group signup-email-confirm-group">
                  <label><span>*</span>Email Confirm:</label>
                  <div className="signup-email-group">
                    <input type="text" name="email_code" onChange={confirmCodeHandle} required />
                    <button type='button' className="signup-verify-btn" onClick={emailCode} disabled={codeButtonActivate}>인증코드 발송</button>
                    <button type='button' className="signup-verify-btn" onClick={confirmCodeChecking} disabled={confirmButtonActivate}>인증확인</button>
                  </div>
                </div>
                <div className="signup-form-group">
                  <label><span>*</span>Birth Date:</label>
                  <input type="date" name="user_birth_date" placeholder="yyyy / mm / dd" required />
                </div>
                <div className="signup-form-group">
                  <label>Mobile No.:</label>
                  <input type="text" name="user_mobile" placeholder="000 000 000" maxlength='9' />
                </div>
                <div className="signup-form-group">
                  <label><span>*</span>Password:</label>
                  <input type="password" name="password" placeholder="xxxxxxxxx" />
                </div>
                <div className="signup-form-group">
                  <label><span>*</span>Confirm Password:</label>
                  <input type="password" name="user_password" placeholder="xxxxxxxxx" required/>
                </div>
                <div className="signup-form-group">
                  <label>Account No.:</label>
                  <input type="text" name="user_bank_num" placeholder="OO 은행 00000 - 00 - 0000000" />
                </div>
                <div className="signup-form-group">
                  <label>Holding Asset:</label>
                  <input type="text" name="user_capital" placeholder="00,000,000,000" />
                </div>
                {/* 메인페이지로 세션 확인하고 로그인화면으로 넘어가도록 해주세요 + 회원가입 되셨습니다 라는 alert창 띄우고!  */}
                <button type="submit" className="signup-signup-btn" disabled={registerButtonActivate}>SIGN UP</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;