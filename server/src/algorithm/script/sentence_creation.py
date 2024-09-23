import argparse
import json
import sys

# 인코딩 문제 해결
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def sample_sentence(data) :
  return print(f"index : {data['user_id']} | \n이메일 : {data['uk_email']} | \n패스워드 : {data['uk_password']}")


def MC_PER_PBR_ROE(data):
    stock_name = ''
    info = ''

    if 'ss' in list(data.keys())[0] :
        stock_name = '삼성전자'
    elif 'ap' in list(data.keys())[0] :
        stock_name = '애플'
    else:
        return 'Unknown stock name'
    
    if 'per' in list(data.keys())[0] :
        info = 'PER은'
    elif 'pbr' in list(data.keys())[0] :
        info = 'PBR은'
    elif 'mc' in list(data.keys())[0] :
        info = '시가총액은'
    elif 'roe' in list(data.keys())[0] :
        info = 'ROE는'
    else:
        return 'Unknown stock info'

    if info == '시가총액은':
        mc = int(list(data.values())[0])
        formatted_mc = "{:,}".format(mc)
        if stock_name == '삼성전자' :
            if mc >= 1000000000000:
                unit = "조"
                value = mc / 1000000000000
            elif mc >= 100000000 :
                unit = "억"
                value = mc / 100000000
            elif mc >= 10000000 :
                unit = "천만"
                value = mc / 10000000
            else:
                unit = "원"
                value = mc

            if unit != "원" :
                return f"{stock_name}의 {info} {formatted_mc}원 ({value:.1f}{unit}) 입니다."
            else :
                return f"{stock_name}의 {info} {formatted_mc}원 입니다."
        
        elif stock_name == '애플' :
            if mc >= 1000000000000:
                unit = "조"
                value = mc / 1000000000000
            elif mc >= 100000000 :
                unit = "억"
                value = mc / 100000000
            elif mc >= 10000000 :
                unit = "천만"
                value = mc / 10000000
            else:
                unit = "달러"
                value = mc

            # 결과 반환
            if unit != "달러" :
                return f"{stock_name}의 {info} {formatted_mc}달러 ({value:.1f}{unit}) 입니다."
            else :
                return f"{stock_name}의 {info} {formatted_mc}달러 입니다."
    
    return f"{stock_name}의 {info} {list(data.values())[0]} 입니다."
  

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('sentence_data')  # 문장에 필요한 데이터 
  parser.add_argument('sentence_key')   # 문장을 판단할 키워드
  args = parser.parse_args()

  sentence_data = args.sentence_data
  keyword = args.sentence_key
  # 전달받은 JSON 데이터를 파싱
  try:
    data = json.loads(sentence_data)
  except json.JSONDecodeError as e:
    print(f"JSONDecodeError: {e}")
    return

  # SQL 쿼리 생성
  if keyword == 'samp':
    sample_sentence(data)
    sys.stdout.flush()  # 출력 후 플러시
  elif keyword == 'MPPR':
      result = MC_PER_PBR_ROE(data)
      if result:
          print(f"{result}")
          sys.stdout.flush()  # 출력 후 플러시


if __name__ == '__main__':
    main()
