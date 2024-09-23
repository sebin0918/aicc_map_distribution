from entity import entityStock
import argparse
import sys

# entityStock 객체 생성
entity_stock = entityStock

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('message')  # message
    parser.add_argument('user_id')  # user id

    args = parser.parse_args()
    
    # 입력된 메시지와 user_id 가져오기
    message = args.message
    user_id = args.user_id

    # 메시지에서 주식 관련 엔티티 추출
    print(entity_stock.stock_information(message))
    sys.stdout.flush()  # Python에서 출력을 즉시 보내도록 설정

if __name__ == '__main__':
    main()
    sys.stdout.flush()