    import { generateUUID } from '../../utils/uuid';
import { db } from '../db';

// 定义一个基础接口，假设所有表都有 id
interface TableWithId {
    id: any;
    updatedAt?: any;
}

export class BaseRepository<T extends TableWithId> {
    protected db = db;

    constructor(protected table: any) {}

    protected generateId(): string {
        return generateUUID();
    }

    // 可以在这里封装通用的 findById, delete 等方法
    // 但为了严谨性，建议在具体 Repository 中实现，以处理特定的关联查询
}