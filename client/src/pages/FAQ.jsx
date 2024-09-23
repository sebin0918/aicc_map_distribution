import React, { useEffect, useState } from "react";
import CategoryFilter from "./CategoryFilter";
import "../styles/FAQ.css";

const categories = [
  { name: "계정 및 사용자", value: "category1" },
  { name: "기술지원 및 문제 해결", value: "category2" },
  { name: "설정 및 구성", value: "category3" },
  { name: "보안", value: "category4" },
  { name: "기술", value: "category5" },
];

const qnaList = [
  { category: "category1", question: "Q. 계정을 어떻게 생성하나요?", answer: "A. 계정을 생성하려면...", show: false },
  { category: "category1", question: "Q. 비밀번호를 잊어버렸습니다. 어떻게 찾나요?", answer: "A. 비밀번호를 잊어버렸다면...", show: false },
  { category: "category2", question: "Q. 사이트가 제대로 표시되지 않아요. 어떻게 해야 하나요?", answer: "A. 사이트가 제대로 표시되지 않는 경우...", show: false },
  { category: "category2", question: "Q. 사이트의 로딩 속도를 개선하려면 어떻게 하나요?", answer: "A. 이트의 로딩 속도를 개선하려면...", show: false },
  { category: "category3", question: "Q. 웹사이트의 기본 설정을 변경하려면 어떻게 하나요?", answer: "A. 웹사이트의 기본 설정을 변경하려면...", show: false },
  { category: "category3", question: "Q. 페이지 레이아웃을 어떻게 변경하나요?", answer: "A. 페이지 레이아웃을 변경하려면...", show: false },
  { category: "category4", question: "Q. 웹사이트 보안을 강화하려면 어떻게 해야 하나요?", answer: "A. 웹사이트 보안을 강화하려면...", show: false },
  { category: "category4", question: "Q. 사용자 데이터는 어떻게 보호되나요?", answer: "A. 사용자 데이터는 암호화된...", show: false },
  { category: "category5", question: "Q. 웹사이트에 애니메이션을 추가하려면 어떻게 하나요?", answer: "A. 웹사이트에 애니메이션을 추가하려면...", show: false },
  { category: "category5", question: "Q. API를 웹사이트에 통합하는 방법은 무엇인가요?", answer: "A. API를 웹사이트에 통합하려면...", show: false },
];

const FAQ = () => {
  const [category, setCategory] = useState("category1");
  const [cardOnOff, setCardOnOff] = useState(qnaList);
  const [showList, setShowList] = useState([]);

  useEffect(() => {
    setShowList(cardOnOff.filter((item) => category === item.category));
  }, [category, cardOnOff]);

  const toggleCard = (question) => {
    const updatedCards = cardOnOff.map((card) => 
      card.question === question ? { ...card, show: !card.show } : card
    );
    setCardOnOff(updatedCards);
  };

  const getQnACard = (item) => {
    return (
      <div className="faq-card" key={item.question}>
        <div
          className="faq-card-title"
          onClick={() => toggleCard(item.question)}
        >
          <span>{item.question}</span>
          <span className="faq-toggle">{item.show ? "-" : "+"}</span>
        </div>
        <div className={item.show ? "faq-card-answer show" : "faq-card-answer"}>
          <span>{item.answer}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="faq-container">
      <div className="faq-title">FAQ</div>
      <div className="faq-separator"></div>
      <CategoryFilter categories={categories} category={category} setCategory={setCategory} />
      <div className="faq-list">{showList.map((item) => getQnACard(item))}</div>
    </div>
  );
};

export default FAQ;
