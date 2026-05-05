(草稿，還會再修改)


# WOMS 排程規則定義

## 關鍵常數
| 常數 | 值 | 說明 |
|---|---|---|
| MAX_LOOKAHEAD_DAYS | 90 | 往後查找產能的最大天數 |
| MAX_ORDER_QUANTITY | 2500 | 單張訂單數量上限 |
| MIN_ORDER_QUANTITY | 25 | 單張訂單數量下限 |
| DAILY_CAPACITY | 10000 | 單日最大產能 |

## 優先順序規則
- 同交期的多筆訂單：以 createdAt 早者優先（FIFO）
- 全局重排時：所有 PENDING 和 SCHEDULED 訂單依 EDD + FIFO 排序後重新分配

## 拆分排程規則
...（根據你們的討論紀錄繼續填）