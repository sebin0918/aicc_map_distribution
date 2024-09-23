import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../styles/HouseHold.css'; 

const HouseHold = () => {
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);                     // 이벤트 상태 관리 추가
  const [incomeEvents, setIncomeEvents] = useState([]);         // 선택된 날짜의 입금 이벤트
  const [expenseEvents, setExpenseEvents] = useState([]);       // 선택된 날짜의 출금 이벤트
  const [totalIncome, setTotalIncome] = useState(0);            // 총 입금 상태
  const [totalExpense, setTotalExpense] = useState(0);          // 총 출금 상태
  const [isEditing, setIsEditing] = useState(false);            // 수정/저장 상태
  const [memo, setMemo] = useState('');                         // 메모 상태

  // 서버에서 이벤트 데이터 가져오기 
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/household/HouseHold');    // 백엔드 API 호출
        const data = await response.json();
        
        // 디버깅용 콘솔 패치데이터 확인
        console.log('Fetched Data:', data);                                               // 전체 데이터를 출력
  
        if (!data || !Array.isArray(data.data)) {
          console.error('Fetched data is not an array or is undefined:', data);
          return;
        }
  
        const formattedEvents = data.data.map(event => {
          console.log('디버깅용 확인:', event.rp_part);                                   // 디버깅 확인 추가된 로그
          const eventType = parseInt(event.rp_part) === 0 ? '입금' : '출금';              // rp_part로 입출금 구분
          const rpAmount = parseFloat(event.rp_amount) || 0;                             // 숫자로 변환하고 변환 실패 시 0으로 설정
          const formattedEvent = {
            start: event.rp_date,
            title: `${eventType}: $${rpAmount}`,                             
            type: eventType,
            rp_amount: rpAmount,
            rp_detail: event.rp_detail,                                                    // rp_detail 추가
          };
          console.log('Formatted event:', formattedEvent);                                 // 변환 후의 이벤트 출력
          return formattedEvent;
        });
  
        setEvents(formattedEvents);                                                        // 이벤트 상태 업데이트
        console.log('Events state after setting:', formattedEvents);                       // 상태가 업데이트된 후 이벤트 배열 로그 출력
        
      } catch (error) {
        console.error('Error fetching household data:', error);
      }
    };
    fetchEvents();
  }, []);



  const calculateTotals = (dateStr) => {
    const dayEvents = events.filter(event => {
      // 이벤트 날짜를 로컬 시간대로 변환하여 비교
      const eventDate = new Date(event.start);  // 이벤트의 start 값을 Date 객체로 변환
      const eventDateStr = eventDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/. /g, '-').replace('.', '');  // 로컬 시간대로 변환 후 'YYYY-MM-DD' 형식으로 변환
      return eventDateStr === dateStr; 
    });
    
    const incomeEvents = dayEvents.filter(e => e.type === '입금');
    const expenseEvents = dayEvents.filter(e => e.type === '출금');
    
    const totalIncome = incomeEvents.reduce((sum, e) => sum + parseFloat(e.rp_amount), 0);
    const totalExpense = expenseEvents.reduce((sum, e) => sum + parseFloat(e.rp_amount), 0);
    
    return { totalIncome, totalExpense, incomeEvents, expenseEvents };
  };
  
  

  // 날짜 셀에 "총 입금"과 "총 출금"을 표시하는 함수
  const renderDayCellContent = (dateStr) => {
    const { totalIncome, totalExpense } = calculateTotals(dateStr);
    return (
      <>
        <div className="household_plustotalpay2">
          총 입금: + {totalIncome.toLocaleString()}원
        </div>
        <div className="household_minustotalpay2">
          총 출금: - {totalExpense.toLocaleString()}원
        </div>
      </>
    );
  };


  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    // 날짜를 UTC 기준으로 변환하여 이벤트 필터링
    //const dateStrUTC = new Date(`${info.dateStr}T00:00:00Z`).toISOString().split('T')[0];

    //const { totalIncome, totalExpense, incomeEvents, expenseEvents } = calculateTotals(dateStrUTC);
    const { totalIncome, totalExpense, incomeEvents, expenseEvents } = calculateTotals(info.dateStr);
    setTotalIncome(totalIncome);
    setTotalExpense(totalExpense);
    setIncomeEvents(incomeEvents);
    setExpenseEvents(expenseEvents);

      // 디버깅용 콘솔 출력 추가
  //console.log('Selected Date (UTC):', dateStrUTC); 
  console.log('Selected Date:', info.dateStr);   
  console.log('Selected Date Income Events:', incomeEvents);
  console.log('Selected Date Expense Events:', expenseEvents);
  setIsModalOpen(true);                                                                           // 모달 열기
  };

  // dayCellDidMount 함수로 각 셀에 총 입금/총 출금을 표시
  const dayCellDidMount = (info) => {
    const dateStr = info.date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/. /g, '-').replace('.', ''); // 로컬 시간대 기준으로 변환
  const { totalIncome, totalExpense } = calculateTotals(dateStr);  // 해당 날짜의 총 입금과 총 출금을 계산
    //const dateStr = info.date.toISOString().split('T')[0];
    //const { totalIncome, totalExpense } = calculateTotals(dateStr);                                 // 해당 날짜의 총 입금과 총 출금을 계산
  
    const content = (
      <div className="house_total-container">
        <div className="household_plustotalpay2">
          총 입금: + {totalIncome.toLocaleString()}원
        </div>
        <div className="household_minustotalpay2">
          총 출금: - {totalExpense.toLocaleString()}원
        </div>
      </div>
    );
  
    ReactDOM.render(content, info.el.querySelector('.fc-daygrid-day-top'));
  };
  
  

  // 메모 변경 핸들러 함수 정의
  const handleMemoChange = (event) => {
    setMemo(event.target.value);
  };

  // 메모 저장 및 수정 핸들러 함수 정의
  const handleEditButtonClick = () => {
    if (isEditing) {
      console.log('Saving memo:', memo);                                                        // 메모 저장 로직
      setIsEditing(false);                                                                      // 수정 모드를 비활성화하고 저장 모드로 변경
      setIsModalOpen(false);                                                                    // 모달 닫기 (저장 후)
    } else {
      setIsEditing(true);                                                                        // 수정 모드로 전환
    }
  };
  

  return (
    <div className='household'>
      <div className='household-body'>
        <div className='household-header'>
          <h1>가계부</h1>

          <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          // events={events}  // 이벤트 렌더링 부분 주석 처리 처음용 이건 나중에 삭제 하면 됌. 
          dateClick={handleDateClick}
          dayCellDidMount={dayCellDidMount} // dayCellDidMount 추가
            headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: ''
            }}
            timeZone="local"
          />
          

        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="household-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="household-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="household-modal-header">
              <h5 className="household-modal-title">Date Info</h5>
            </div>

            <div className="household-modal-body">
              <div id="household-modalDate">{selectedDate}</div>
              <div className="household-box-container">
                
              <div id="household-plusbox">
                <h2>[ 입금 내역 ]</h2>
                {/* 입금 총합 출력 */}
                <div className="household_plustotalpay">
                총 입금: <span style={{ fontWeight: 'bold' }}>{`+ ${totalIncome}원`}</span>
                </div>
                {incomeEvents.map((event, index) => (
                  <div key={index}>
                    <div className="household_plusdetail">{`${index + 1}. ${event.rp_detail} : + ${event.rp_amount}원`}</div>
                  </div>
                ))}
              </div>

                <div id="household-minusbox">
                  <h2>[ 출금 내역 ]</h2>
                  {/* 출금 총합 출력 */}
                  <div className="household_minustotalpay">
                  총 출금: <span style={{fontWeight:'bold'}}> {`- ${totalExpense}원`}</span>
                  </div>
                  {expenseEvents.map((event, index) => (
                    <div key={index}>
                      <div className="household_minusdetail">{`${index + 1}. ${event.rp_detail} : - ${event.rp_amount}원`}</div>
                    </div>
                  ))}
                </div>

                <div id="household-memobox">
                  <textarea
                    id="memo-textarea"
                    placeholder="메모를 입력하세요..."
                    value={memo}
                    onChange={handleMemoChange}
                  />
                </div>
              </div>
            </div>

            <div className="household-modal-footer">
              {/* 수정/저장 버튼 텍스트 변경 */}
              <button 
                type="button" 
                id="household-edit-btn" 
                className="household-btn household-btn-edit" 
                onClick={handleEditButtonClick}
              >
                {isEditing ? '메모 저장' : '메모 수정'}
              </button>
              <button 
                type="button" 
                className="household-btn household-btn-close" 
                onClick={() => setIsModalOpen(false)}
              >
                종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseHold;
