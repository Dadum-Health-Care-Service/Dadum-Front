import { Button } from 'react-bootstrap';

const AddressSearch = ({ onAddressSelect, buttonText = "우편번호" }) => {
  const handleAddressSearch = () => {
    // 다음 우편번호 API가 로드되었는지 확인
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분입니다.
        // 각 주소의 노출 규칙에 따라 주소를 조합합니다.
        // 내려오는 변수가 객체이므로, 순서대로 주소 정보를 조합해야 합니다.
        let addr = ''; // 주소 변수
        let extraAddr = ''; // 참고항목 변수

        //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }

        // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
        if(data.userSelectedType === 'R'){
          // 법정동명이 있을 경우 추가한다. (법정리는 제외)
          // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
          if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
            extraAddr += data.bname;
          }
          // 건물명이 있고, 공동주택일 경우 추가한다.
          if(data.buildingName !== '' && data.apartment === 'Y'){
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
          if(extraAddr !== ''){
            extraAddr = ' (' + extraAddr + ')';
          }
          // 조합된 참고항목을 해당 필드에 넣는다.
          addr += extraAddr;
        }

        // 우편번호와 주소 정보를 해당 필드에 넣는다.
        const addressData = {
          zipCode: data.zonecode,
          address: addr,
          detailAddress: '' // 상세주소는 사용자가 직접 입력하도록 빈 값으로 설정
        };

        onAddressSelect(addressData);
      },
      width: '100%',
      height: '100%'
    }).open();
  };

  return (
    <Button 
      variant="outline-secondary" 
      onClick={handleAddressSearch}
      type="button"
    >
      {buttonText}
    </Button>
  );
};

export default AddressSearch;
