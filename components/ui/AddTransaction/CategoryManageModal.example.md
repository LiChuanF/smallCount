# CategoryManageModal 多选功能使用示例

## 单选模式示例

```tsx
import React, { useState } from 'react';
import CategoryManageModal from './CategoryManageModal';
import { NewTag } from '@/types';

const SingleSelectionExample = () => {
  const [visible, setVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<NewTag[]>([
    // 你的分类数据
  ]);

  const handleSelectionChange = (selectedIds: string[]) => {
    // 单选模式下，selectedIds数组只有一个元素
    if (selectedIds.length > 0) {
      setSelectedCategoryId(selectedIds[0]);
      console.log('选中的分类ID:', selectedIds[0]);
    }
  };

  return (
    <View>
      <Button title="选择分类" onPress={() => setVisible(true)} />
      
      <CategoryManageModal
        visible={visible}
        onClose={() => setVisible(false)}
        categories={categories}
        currentType="expense"
        onUpdateCategories={setCategories}
        // 启用选择功能
        enableSelection={true}
        // 单选模式
        selectionMode="single"
        // 已选中的分类ID
        selectedIds={selectedCategoryId ? [selectedCategoryId] : []}
        // 选择变化回调
        onSelectionChange={handleSelectionChange}
        // 确认按钮文本
        confirmButtonText="确定选择"
        // 隐藏编辑按钮，避免操作冲突
        showEditButtons={false}
      />
    </View>
  );
};
```

## 多选模式示例

```tsx
import React, { useState } from 'react';
import CategoryManageModal from './CategoryManageModal';
import { NewTag } from '@/types';

const MultipleSelectionExample = () => {
  const [visible, setVisible] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<NewTag[]>([
    // 你的分类数据
  ]);

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedCategoryIds(selectedIds);
    console.log('选中的分类IDs:', selectedIds);
  };

  return (
    <View>
      <Button title="选择多个分类" onPress={() => setVisible(true)} />
      
      <CategoryManageModal
        visible={visible}
        onClose={() => setVisible(false)}
        categories={categories}
        currentType="expense"
        onUpdateCategories={setCategories}
        // 启用选择功能
        enableSelection={true}
        // 多选模式
        selectionMode="multiple"
        // 已选中的分类ID数组
        selectedIds={selectedCategoryIds}
        // 选择变化回调
        onSelectionChange={handleSelectionChange}
        // 最多选择5个分类
        maxSelection={5}
        // 确认按钮文本
        confirmButtonText="确定选择"
        // 隐藏编辑按钮，避免操作冲突
        showEditButtons={false}
      />
    </View>
  );
};
```

## 原有功能保持不变

```tsx
import React, { useState } from 'react';
import CategoryManageModal from './CategoryManageModal';
import { NewTag } from '@/types';

const OriginalFunctionExample = () => {
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<NewTag[]>([
    // 你的分类数据
  ]);

  return (
    <View>
      <Button title="管理分类" onPress={() => setVisible(true)} />
      
      <CategoryManageModal
        visible={visible}
        onClose={() => setVisible(false)}
        categories={categories}
        currentType="expense"
        onUpdateCategories={setCategories}
        // 不启用选择功能，保持原有功能
        enableSelection={false}
        // 或者直接不传enableSelection属性，默认为false
      />
    </View>
  );
};
```

## 参数说明

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| enableSelection | boolean | false | 是否启用选择模式 |
| selectionMode | 'single' \| 'multiple' | 'single' | 选择模式：单选或多选 |
| selectedIds | string[] | [] | 已选中的分类ID数组 |
| onSelectionChange | (selectedIds: string[]) => void | - | 选择变化时的回调函数 |
| maxSelection | number | - | 多选模式下最大选择数量（可选） |
| confirmButtonText | string | '确定' | 确认按钮文本 |
| showEditButtons | boolean | true | 是否显示编辑和删除按钮 |

## 注意事项

1. 当 `enableSelection` 为 `true` 时，组件将进入选择模式，原有的增删改功能将被隐藏（除非 `showEditButtons` 设为 `true`）。
2. 单选模式下，`selectedIds` 数组最多只有一个元素。
3. 多选模式下，可以通过 `maxSelection` 限制最大选择数量。
4. 选择模式下，点击分类项会触发选择/取消选择操作，而不是编辑操作。