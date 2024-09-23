import React, { useState, useRef } from 'react';
import './Components_Styles.css';
import Chatbot_image from '../images/ai_chat_image.png';

function ChatBot() {
  const [modalOpen, setModalOpen] = useState(false);
  const modalBackground = useRef();
  const [chat, setChat] = useState(''); // 입력된 chat을 받을 변수
  const [chatList, setChatList] = useState([]); // 채팅 기록

  const handleSendChat = async () => {
    try {

    } catch {

    }

    if (chat.trim()) {
      const newMessage = { text: chat, type: 'user' }; // 사용자 메시지 유형 설정
      setChatList(prevChatList => [newMessage, ...prevChatList]); // 새 메시지를 기존 채팅 리스트에 추가
      const currentChat = chat; // 입력 필드를 초기화하기 전에 현재 메시지 저장
      setChat(''); // 입력 필드 초기화

      // 서버로 메시지 전송
      try {
        const response = await fetch('http://localhost:5000/api/chat-bot/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: currentChat }), // 현재 메시지를 서버로 전송
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          //console.log('Response Data:', data.data);
          
          if (data.data) {
            // 받은 메시지를 그대로 chatList에 추가
            setChatList(prevChatList => [{ text: data.data, type: 'bot' }, ...prevChatList]); // 챗봇의 응답 추가
            //console.log('Updated ChatList after bot response:', [{ text: data.data, type: 'bot' }, ...chatList]); // 추가 로그
          }
        } else {
          console.error('Failed to send chat message');
        }
      } catch (error) {
        console.error('Error sending chat message', error);
      }
    }
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  };

  return (
    <div className='ChatBot'>
      <img className='ChatBot-image' src={Chatbot_image} onClick={() => setModalOpen(true)} alt="Chatbot Icon" />
      {
        modalOpen &&
        <div className='ChatBot-modal-container' ref={modalBackground} onClick={e => {
          if (e.target === modalBackground.current) {
            setModalOpen(false);
          }
        }}>
          <div className='ChatBot-modal-content'>
            <div className='ChatBot-modal-text'>
              {chatList.map((ct, index) => (
                <div key={index} className={`ChatBot-message-container ${ct.type === 'user' ? 'user' : 'bot'}`}>
                  <p style={{ whiteSpace: 'pre-line' }} className={`ChatBot-message ${ct.type === 'user' ? 'ChatBot-question' : 'ChatBot-answer'}`}>
                    {ct.text}
                    {(ct.text === '잘못된 입력입니다. 다시 입력해주세요.' || (ct.text.split('\n').length - 1 < 10)) ? (
                      null
                    ) : (
                      <button>상세 내용</button>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <input 
              className='ChatBot-modal-input'
              type='text'
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              onKeyDown={handleEnter}
              placeholder='메세지를 입력하세요...'
            />
            <button 
              type='submit' 
              className='ChatBot-modal-send-button'
              onClick={handleSendChat}
            >SEND</button>
          </div>
        </div>
      }
    </div>
  );
}

export default ChatBot;
