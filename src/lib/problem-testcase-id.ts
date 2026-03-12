export function buildProblemTestCaseId(
  problemId: string,
  index: number,
  isHidden: boolean
) {
  return `${problemId}::${isHidden ? "hidden" : "sample"}::${index + 1}`;
}
