
interface DrizzleQuery {
  limit: (limit: number) => any;
  offset: (offset: number) => any;
  then: (onfulfilled?: (value: any) => any) => any; // 确保它是 Promise/Thenable
}

// 分页请求参数接口
export interface PaginationParams {
  page?: number;     // 当前页码，默认为 1
  pageSize?: number; // 每页条数，默认为 10或20
}

// 分页返回结果接口
export interface PaginatedResult<T> {
  items: T[];      // 当前页的数据列表
  total: number;   // 总记录数
  page: number;    // 当前页码
  pageSize: number;// 每页条数
  totalPages: number; // 总页数
  hasNextPage: boolean; // 是否有下一页
}

/**
 * 通用分页查询构造器
 * @param qb - Drizzle 查询对象 (使用宽泛类型以避免 TS 泛型地狱)
 * @param countQb - 计数查询对象
 * @param params - 分页参数
 */
export async function withPagination<T>(
  qb: any, // <--- 关键修改：直接使用 any。Drizzle 的 QueryBuilder 类型太深，很难手动匹配。
  countQb: any | null, // <--- 关键修改：同上
  params: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  // 1. 添加分页限制
  // 因为我们把 qb 设为了 any，这里就能随意调用 limit/offset 而不报错
  const queryWithPagination = qb.limit(pageSize).offset(offset);

  // 2. 并行执行
  const [items, totalResult] = await Promise.all([
    queryWithPagination, 
    countQb ? countQb : Promise.resolve(null)
  ]);

  // 3. 解析总数
  const total = totalResult ? Number(totalResult[0]?.count || 0) : 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    items: items as T[], // 强制转换为传入的泛型 T
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
  };
}