/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆）
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证密码强度
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证金额格式
 */
export const isValidAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

/**
 * 验证日期格式 (YYYY-MM-DD)
 */
export const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * 验证分类名称
 */
export const isValidCategoryName = (name: string): boolean => {
  return name.trim().length > 0 && name.trim().length <= 20;
};

/**
 * 验证账本名称
 */
export const isValidLedgerName = (name: string): boolean => {
  return name.trim().length > 0 && name.trim().length <= 50;
};

/**
 * 验证交易描述
 */
export const isValidTransactionDescription = (description: string): boolean => {
  return description.trim().length > 0 && description.trim().length <= 200;
};

/**
 * 通用字段验证
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName}不能为空`;
  }
  return null;
};

/**
 * 验证字符串长度
 */
export const validateLength = (
  value: string, 
  minLength: number, 
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.length < minLength) {
    return `${fieldName}长度不能少于${minLength}位`;
  }
  if (value.length > maxLength) {
    return `${fieldName}长度不能超过${maxLength}位`;
  }
  return null;
};