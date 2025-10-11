# frontend

安装依赖：

```bash
bun install
```

运行：

```bash
bun s
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


使用sqlite-parser读取sql语句并生成包含json数据的数列表，再使用写的extract函数根据类型提取并生成符合要求的json数据

记录：G6没有成果渲染出ER图，打算使用gojs

```
          const tables = [
          {
            name: 'customer',
            columns: [
              { name: 'id',        type: 'INTEGER', pk: true,  notNull: true },
              { name: 'name',      type: 'TEXT',    pk: false, notNull: true },
              { name: 'email',     type: 'TEXT',    pk: false, notNull: false },
              { name: 'created_at',type: 'DATETIME',pk: false, notNull: false }
            ],
            pks: ['id'],
            fks: []
          },
          {
            name: 'orders',
            columns: [
              { name: 'id',         type: 'INTEGER', pk: true,  notNull: true },
              { name: 'customer_id',type: 'INTEGER', pk: false, notNull: true },
              { name: 'amount',     type: 'REAL',    pk: false, notNull: true },
              { name: 'status',     type: 'TEXT',    pk: false, notNull: true },
              { name: 'created_at', type: 'DATETIME',pk: false, notNull: false }
            ],
            pks: ['id'],
            fks: [
              {
                columns: ['customer_id'],
                refTable: 'customer',
                refColumns: ['id']
              }
            ]
          }
        ];
```