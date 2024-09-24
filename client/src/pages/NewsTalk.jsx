import React, { useState, useEffect, useRef } from 'react';
import '../styles/NewsTalk.css'; // 스타일 파일의 경로
import newsChatHeadIcon from '../images/news_chat_head_icon.png'; 
import NewsTalk_User_icon from '../images/NewsTalk_User_icon.png'; // 사용자 아이콘 이미지
import sendIcon from '../images/news_chat_post_icon.png'; 

function NewsTalk() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null); // 스크롤 자동 이동을 위한 ref

  // 서버로부터 메시지를 받아오는 함수
  const fetchMessages = async () => {
    try {
      const response = await fetch('${process.env.REACT_APP_API_URL}/api/messages', {
        credentials: 'include', // 세션 쿠키 포함
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages(); // 컴포넌트 마운트 시 메시지 불러오기
  }, []);

  // 새로운 메시지가 추가될 때 스크롤을 최신 메시지로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 메시지 전송 함수
  const handleSendMessage = async () => {
    if (message.trim()) {
      const currentTime = new Date().toLocaleTimeString();
      const newMessage = { text: message, time: currentTime };

      try {
        const response = await fetch('${process.env.REACT_APP_API_URL}/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 세션 쿠키 포함
          body: JSON.stringify(newMessage),
        });

        if (response.ok) {
          setMessages((prevMessages) => [newMessage, ...prevMessages]); // 함수형 업데이트 사용
          setMessage('');
        } else {
          console.error('Failed to send message:', response.statusText);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // 엔터키 입력 시 메시지 전송
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="news-talk">
      <p>
        <img src={newsChatHeadIcon} alt="News Chat Icon" style={{ width: '65px', height: '50px', marginLeft: '10px' }} />
        <span>NewsTalk</span>
      </p>
      <div className="news-talk-messages">
        {messages.map((msg, index) => (
          <div key={index} className="news-talk-message-container">
            <div className="news-talk-message">
              <div>{msg.text}</div>
              <div className="news-talk-timestamp">{msg.time}</div>
            </div>
            <img src={NewsTalk_User_icon} alt="User Icon" className="news-talk-user-icon" />
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* 스크롤 자동 이동을 위한 요소 */}
      </div>

      <div className="news-talk-input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
        />
        <button
          className="news-talk-send-button"
          onClick={handleSendMessage}
          aria-label="Send message" // 접근성 속성 추가
        >
          <img src={sendIcon} alt="Send Icon" className="news-talk-send-icon" />
        </button>
      </div>
    </div>
  );
}

export default NewsTalk;
