/**
 * data.json 데이터 처리 유틸리티
 */

/**
 * 모든 운동의 지침을 백틱(`) 안에 줄바꿈이 있는 형태로 만듭니다
 * @param {Object} data - 원본 data.json 데이터
 * @returns {Object} 지침이 백틱 안에 줄바꿈으로 합쳐진 데이터
 */
export const createInstructionsList = (data) => {
  if (!data || !data.exercises) {
    return data;
  }

  // 모든 운동의 지침을 백틱 안에 줄바꿈이 있는 형태로 만들기
  const instructionsList = [];

  data.exercises.forEach((exercise) => {
    if (exercise.instructions && Array.isArray(exercise.instructions)) {
      // 각 운동의 지침을 백틱 안에 줄바꿈으로 합치기
      const exerciseInstructions = exercise.instructions.join("\n");
      instructionsList.push(`${exerciseInstructions}`);
    }
  });

  return {
    totalExercises: instructionsList.length,
    instructionsList: instructionsList,
    processedAt: new Date().toISOString(),
  };
};

/**
 * 백틱 안에 줄바꿈이 있는 지침 리스트를 JSON 파일로 다운로드합니다
 * @param {Object} data - 원본 운동 데이터
 * @param {string} filename - 다운로드할 파일명
 */
export const downloadInstructionsList = (
  data,
  filename = "instructions-list"
) => {
  try {
    const processedData = createInstructionsList(data);

    const blob = new Blob([JSON.stringify(processedData, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${
      new Date().toISOString().split("T")[0]
    }.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(
      "백틱 안에 줄바꿈이 있는 지침 리스트가 성공적으로 다운로드되었습니다:",
      processedData
    );
    return true;
  } catch (error) {
    console.error("지침 리스트 다운로드 중 오류가 발생했습니다:", error);
    return false;
  }
};
