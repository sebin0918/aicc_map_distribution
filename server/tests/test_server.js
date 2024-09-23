// test_server.js

// 필요한 라이브러리 로드
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js'); // 실제 서버 파일 경로를 설정해 주세요
const should = chai.should();

chai.use(chaiHttp);

describe('Server', () => {
  // 서버가 잘 작동하는지 확인하는 기본 테스트
  it('서버가 200 응답을 반환해야 합니다', (done) => {
    chai.request(server)
      .get('/')  // 기본 경로에 요청
      .end((err, res) => {
        res.should.have.status(200); // 200 상태 코드를 기대
        done();  // 테스트 완료
      });
  });

  // 로그인 테스트 예시 (POST 요청)
  it('로그인이 성공해야 합니다', (done) => {
    chai.request(server)
      .post('http://localhost:5000/api/auth/login')  // 실제 로그인 경로로 변경
      .send({
        user_email: 'root@root.com',  // 실제 테스트 사용자 정보로 변경
        user_password: '1'
      })
      .end((err, res) => {
        res.should.have.status(200); // 로그인 성공 시 200 상태 코드
        res.body.should.have.property('token');  // 토큰을 반환하는지 확인
        done();
      });
  });
});
