/**
 * 获取字符串的第一个字符，并转为大写（支持多语言：中文、英文、Unicode字符等）
 * @param str 输入字符串（可传入任意类型，内部会做类型校验）
 * @returns 处理后的首字符（无效输入返回空字符串）
 */
export function getFirstCharToUpper(str: unknown): string {
  // 1. 类型校验：如果不是字符串，直接返回空字符串
  if (typeof str !== 'string') {
    console.warn('输入不是有效的字符串，返回空字符串');
    return '';
  }

  // 2. 处理空字符串或仅含空白字符的情况
  const trimmedStr = str.trim();
  if (trimmedStr.length === 0) {
    console.warn('输入字符串为空或仅包含空白字符，返回空字符串');
    return '';
  }

  // 3. 安全获取第一个字符（支持所有Unicode字符，包括中文、emoji等）
  // Array.from 能正确处理Unicode surrogate pair（如某些emoji、特殊字符）
  const firstChar = Array.from(trimmedStr)[0];

  // 4. 转为大写：使用 toLocaleUpperCase() 而非 toUpperCase()，更好支持多语言
  // 例如：土耳其语的 'i' 会转为 'İ'，德语的 'ß' 会转为 'SS'，中文不受影响（原样返回）
  const upperFirstChar = firstChar.toLocaleUpperCase();

  return upperFirstChar;
}