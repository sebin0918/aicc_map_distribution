import re
import time
import nltk
import spacy
import os

from spacy.tokens import Span
from spacy.matcher import Matcher
from spacy.util import filter_spans
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta

from konlpy.tag import Hannanum
# from pykospacing import Spacing
from konlpy.tag import Okt, Kkma
from soynlp.normalizer import repeat_normalize
from nltk import word_tokenize, pos_tag, ne_chunk

okt = Okt()
kkma = Kkma()
# spacing = Spacing()
hannanum = Hannanum()

# nltk.download('punkt')
# nltk.download('averaged_perceptron_tagger')
# nltk.download('maxent_ne_chunker')
# nltk.download('words')


try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker')

try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')



# text = input()
#def process_text(text):
#    text = re.sub(r"[^가-힣a-zA-Z0-9\s]", "", text)
#    text = repeat_normalize(text, num_repeats=3)
#    text = re.sub(r'\s+', ' ', text).strip()
    #text = spacing(text)
#    return text

def extract_stock_entities(text):
    
#    text = process_text(text)
    
    """주어진 텍스트에서 주식 관련 엔티티를 추출하는 통합 함수입니다."""
    # 주식 관련 패턴 정의
    patterns1 = {
        "주가": r"주가|주식|종가",
        "증시": r"증시",
        "삼성전자": r"삼성전자|삼성|삼전|samsung",
        "애플": r"애플|apple",
        "비트코인": r"비트코인|bitcoin|비트|코인|coin",
        "PER": r"PER|주가수익비율|Price Earning Ratio|per",
        "PBR": r"PBR|주가순자산비율|Price Book-value Ratio|pbr",
        "ROE": r"ROE|자기자본이익률|Return on Equity|roe",
        "MC": r"MC|시가총액|총액|시총|Market Cap|mc",
        "경제지표":r"경제지표|국내총생산|GDP|기준금리|IR|수입물가지수|IPI|생산자물가지수|PPI|소비자물가지수|CPI|외환보유액"
    }
    
    # 주식 관련 예측 및 변동성 패턴 정의 (동사 포함)
    patterns2 = {
        "예상": r"예상|예측",
        "평균": r"평균|평균값|평균단가|단가|평단가",
        "가격": r"가격|값"
    }


    # 패턴 통합
    combined_patterns = {**patterns1, **patterns2}

    # 텍스트에서 패턴에 맞는 주요 키워드 추출
    def extract_main_keyword(text, pattern):
        match = re.search(pattern, text)
        if match:
            return match.group(0)  # 매칭된 주요 키워드 반환
        return None  # 매칭되지 않으면 None 반환

    # 텍스트에서 조사와 종결어미를 제거하여 명사만 반환
    def clean_text(text):
        cleaned_text = re.sub(r'(과|와|의|가|이|을|를|은|는|에서|으로|고|까지|부터|도|만|조차|뿐|에|와|에서|로|이다|입니다|해요|하겠습니다)$', '', text)
        return cleaned_text

    # 사용자 정의 spaCy 파이프라인 컴포넌트
    @spacy.Language.component("custom_stock_entity_adder")
    def custom_stock_entity_adder(doc):
        new_ents = []

        for token in doc:
            # 형태소 분석을 통해 명사와 동사/형용사 추출
            token_pos = okt.pos(token.text)
            noun_phrase = ''.join([word for word, tag in token_pos if tag in ['Noun', 'Alpha']])
            verb_phrase = ''.join([word for word, tag in token_pos if tag in ['Verb', 'Adjective']])
            
            # 형태소 분석 결과와 원래 텍스트 보정
            noun_phrase_cleaned = clean_text(noun_phrase)  # 형태소 분석된 명사에서 조사를 제거
            original_text_cleaned = clean_text(token.text)  # 원래 텍스트에서 조사를 제거

            # 명사 및 동사 패턴 매칭
            found = False
            for label, pattern in combined_patterns.items():
                if noun_phrase_cleaned:  # 명사가 있을 경우
                    main_keyword = extract_main_keyword(noun_phrase_cleaned, pattern)
                    if main_keyword:
                        new_ent = Span(doc, token.i, token.i + 1, label=label)
                        new_ent._.set("cleaned_text", noun_phrase_cleaned)
                        new_ents.append(new_ent)
                        found = True
                        break

                if verb_phrase:  # 동사 또는 형용사일 경우
                    main_keyword = extract_main_keyword(verb_phrase, pattern)
                    if main_keyword:
                        new_ent = Span(doc, token.i, token.i + 1, label=label)
                        new_ent._.set("cleaned_text", verb_phrase)
                        new_ents.append(new_ent)
                        found = True
                        break

            if not found:
                # 원래 텍스트 기반 매칭 시도
                for label, pattern in combined_patterns.items():
                    main_keyword = extract_main_keyword(original_text_cleaned, pattern)
                    if main_keyword:
                        new_ent = Span(doc, token.i, token.i + 1, label=label)
                        new_ent._.set("cleaned_text", original_text_cleaned)
                        new_ents.append(new_ent)
                        break

        # 최종 엔티티 설정 (조사 제거된 텍스트 사용)
        doc.ents = new_ents

        return doc


    # spaCy 모델 로드
    nlp = spacy.load("ko_core_news_sm")
    
    # 확장 속성 등록 (cleaned_text)
    Span.set_extension("cleaned_text", default=None, force=True)

    # custom_stock_entity_adder가 이미 파이프라인에 존재하면 제거
    if "custom_stock_entity_adder" in nlp.pipe_names:
        nlp.remove_pipe("custom_stock_entity_adder")

    # custom_stock_entity_adder를 spaCy 파이프라인에 추가
    nlp.add_pipe("custom_stock_entity_adder", after="ner")

    # 텍스트 처리
    doc = nlp(text)

    # 결과 출력
    entities = [(ent._.get("cleaned_text"), ent.label_) for ent in doc.ents]

    return entities

# 주식 정보: PER, PBR, ROE, MC

def stock_information(text):
    # 엔터티 추출
    entities = extract_stock_entities(text)
    
    # 엔터티 레이블 추출
    entity_labels = []
    for _, label in entities:
        entity_labels.append(label)
    
    # 주식 종목 리스트
    stock_labels = ["삼성전자", "애플", "비트코인"]

    # 사용자가 요청한 주식 종목을 추출
    requested_stocks = [stock for stock in stock_labels if stock in entity_labels]

    # 주식 정보 엔터티 (PBR, PER, ROE, MC) 리스트
    info_labels = ["PBR", "PER", "ROE", "MC"]

    # 사용자가 요청한 주식 정보 엔터티를 추출
    requested_infos = [info for info in info_labels if info in entity_labels]
    
    # SQL 쿼리 생성 및 답변 생성
    if requested_stocks and requested_infos:
        # 각 주식 종목과 정보에 따라 쿼리와 답변 생성
        stock = requested_stocks[0]  # 하나의 주식 종목만 처리
        info = requested_infos[0]  # 하나의 정보만 처리

        # SQL 쿼리 생성
        date = "2024-09-01"
        query = ""
        if stock == "삼성전자":
            if info == "PBR":
                query = f"MPPRSELECT sc_ss_pbr FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "PER":
                query = f"MPPRSELECT sc_ss_per FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "ROE":
                query = f"MPPRSELECT sc_ss_roe FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "MC":
                query = f"MPPRSELECT sc_ss_mc FROM tb_stock WHERE fd_date = '{date}';"
                return query

        elif stock == "애플":
            if info == "PBR":
                query = f"MPPRSELECT sc_ap_pbr FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "PER":
                query = f"MPPRSELECT sc_ap_per FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "ROE":
                query = f"MPPRSELECT sc_ap_roe FROM tb_stock WHERE fd_date = '{date}';"
                return query
            elif info == "MC":
                query = f"MPPRSELECT sc_ap_mc FROM tb_stock WHERE fd_date = '{date}';"
                return query

        elif stock == "비트코인":
            if info == "PBR":
                return ''
            elif info == "PER":
                return ''
            elif info == "ROE":
                return ''
            elif info == "MC":
                return ''
    
    return ''


# stock_information