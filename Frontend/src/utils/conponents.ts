import G6 from "@antv/g6";

const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
const slidebarContent = document.getElementById(
  "slidebar-content"
) as HTMLElement;

type Table = {
  name: string;
  columns: {
    name: string;
    type: string;
    pk: boolean;
    notNull: boolean;
    default?: any;
  }[];
  pks: string[];
  fks: {
    columns: string[];
    refTable: string;
    refColumns: string[];
  }[];
};

G6.registerNode("er-table", {
  draw(cfg: any, group: any) {
    const { name, columns } = cfg;
    const lineH = 20,
      headerH = 30,
      w = 200,
      h = headerH + columns.length * lineH;

    const keyShape = group.addShape("rect", {
      attrs: {
        x: 0,
        y: 0,
        width: w,
        height: h,
        stroke: "#5B8FF9",
        fill: "#fff",
        radius: 4,
      },
    });
    group.addShape("text", {
      attrs: {
        x: w / 2,
        y: headerH / 2,
        text: name,
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        textBaseline: "middle",
        fill: "#333",
      },
    });
    group.addShape("line", {
      attrs: {
        x1: 0,
        y1: headerH,
        x2: w,
        y2: headerH,
        stroke: "#5B8FF9",
        lineWidth: 2,
      },
    });

    columns.forEach((col: any, i: number) => {
      const icon = col.pk ? "🔑" : col.fk ? "🔗" : "";
      group.addShape("text", {
        attrs: {
          x: 8,
          y: headerH + i * lineH + lineH / 2,
          text: `${col.name}  ${col.type}  ${icon}`,
          fontSize: 12,
          textBaseline: "middle",
          fill: "#666",
        },
      });
    });
    return keyShape;
  },
});

// function hideRightSlidebar() {
//   rightSlidebar.classList.add("translate-x-full");
// }

// function showRightSlidebar(title:string, content:string) {
//   slidebarTitle.textContent = title;
//   slidebarContent.innerHTML = content;
//   rightSlidebar.classList.remove("translate-x-full");
// };

const conponents = {
  //   rightSlidebar: document.getElementById("right-slidebar") as HTMLElement,
  //   slidebarTitle: document.getElementById("slidebar-title") as HTMLElement,
  //   slidebarContent: document.getElementById("slidebar-content") as HTMLElement,

  hideRightSlidebar() {
    rightSlidebar.classList.add("translate-x-full");
  },

  showRightSlidebar(title: string, content: string) {
    slidebarTitle.textContent = title;
    slidebarContent.innerHTML = content;
    rightSlidebar.classList.remove("translate-x-full");
  },

  extract(ast: any): Table[] {
    return ast.statement
      .filter((s: any) => s.variant === "create" && s.format === "table")
      .map((st: any) => {
        const tbl: Table = {
          name: st.name.name,
          columns: [],
          pks: [],
          fks: [],
        };

        st.definition.forEach((d: any) => {
          // ----- 列 -----
          if (d.variant === "column") {
            const col = {
              name: d.name,
              type: d.datatype.variant,
              pk: false,
              notNull: false,
              default: undefined,
            };
            (d.definition || []).forEach((c: any) => {
              if (c.variant === "primary key") col.pk = true;
              if (c.variant === "not null") col.notNull = true;
              if (c.variant === "default") col.default = c.value.value;
            });
            tbl.columns.push(col);
            if (col.pk) tbl.pks.push(col.name);
          }

          // ----- 表级主键 -----
          if (
            d.variant === "constraint" &&
            d.definition?.[0]?.variant === "primary key"
          ) {
            tbl.pks = d.columns.map((c: any) => c.name);
          }

          // ----- 外键 -----
          if (
            d.variant === "constraint" &&
            d.definition?.[0]?.variant === "foreign key"
          ) {
            const fk = d.definition[0].references;
            tbl.fks.push({
              columns: d.columns.map((c: any) => c.name),
              refTable: fk.name,
              refColumns: fk.columns.map((c: any) => c.name),
            });
          }
        });
        return tbl;
      });
  },

  drawER(tables: Table[], mountId: string) {
    const nodes = tables.map((t) => ({
      id: t.name,
      name: t.name,
      columns: t.columns,
      shape: "er-table",
    }));
    const edges = tables.flatMap((t) =>
      t.fks.map((fk) => ({
        source: t.name,
        target: fk.refTable,
        label: fk.columns.join(" → "),
        shape: "line",
        style: { endArrow: { path: G6.Arrow.triangle(6, 8, 0), fill: "#999" } },
      }))
    );

    const graph = new G6.Graph({
      container: mountId,
      width: 1200,
      height: 600,
      fitView: true,
      fitViewPadding: 20,
      layout: { type: "dagre", rankdir: "LR", nodesep: 60, ranksep: 80 },
      defaultEdge: {
        style: { stroke: "#999", lineWidth: 1 },
        labelCfg: { autoRotate: true, style: { fontSize: 12 } },
      },
    } as any);
    console.log('graph 类型:', typeof graph);
    console.log('graph 构造函数:', graph?.constructor?.name);
    console.log('graph 是否有 getNodes:', typeof graph?.getNodes);
    graph.changeData({ nodes, edges });
    graph.render();
    console.log("节点数量:", graph.getNodes().length);
    graph.getNodes().forEach((n, i) => {
      const m = n.getModel();
      console.log(
        `节点 ${i}: id=${m.id}, shape=${m.shape}, x=${m.x}, y=${m.y}`
      );
    });
    return graph;
  },
};

export default conponents;
