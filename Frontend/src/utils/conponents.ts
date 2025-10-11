import * as go from "gojs"


const $ = go.GraphObject.make; 

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


const conponents = {
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
    const container = document.getElementById(mountId);
    if (!container) {
      console.error(`Container with ID '${mountId}' not found.`);
      return null;
    }

    const nodeDataArray = tables.map((t) => ({
      key: t.name, 
      name: t.name,
      columns: t.columns,
    }));

    const linkDataArray = tables.flatMap((t) =>
      t.fks.map((fk) => ({
        from: t.name, 
        to: fk.refTable, 
        label: fk.columns.join(" → "),
      }))
    );


    const diagram = $(go.Diagram, mountId, 
      {
        initialAutoScale: go.Diagram.Uniform,
        layout: $(go.LayeredDigraphLayout,
          { direction: 0, layerSpacing: 80, columnSpacing: 60 } 
        ),
        "undoManager.isEnabled": true, 
      }
    );

    diagram.nodeTemplate = $(go.Node, "Auto",
        {
          selectionAdornmentTemplate: nodeAdornmentTemplate,
          locationSpot: go.Spot.Center,
          resizable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        },
        $(go.Shape, "RoundedRectangle", {
            stroke: "#5B8FF9", 
            fill: "#fff", 
            strokeWidth: 2,
        }),
        $(go.Panel, "Table",
            {
                defaultAlignment: go.Spot.Left,
                margin: 4,
            },
            $(go.RowColumnDefinition, { row: 0, column: 0,  separatorStroke: "#a4b1ddff", separatorPadding: 4 }),
            $(go.TextBlock,
                { row: 0, column: 0, columnSpan: 3, font: "bold 14px sans-serif", stroke: "#faf9f9ff", background: "#5B8FF9", alignment: go.Spot.Center, stretch: go.GraphObject.Horizontal, margin: 4 },
                new go.Binding("text", "name")
            ),
            $(go.Panel, "Table",
                {
                    row: 1, column: 0, columnSpan: 3,
                    itemTemplate: makeItemTemplate($), 
                },
                new go.Binding("itemArray", "columns")
            )
        )
    );

    diagram.linkTemplate = $(go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
      $(go.Shape, { stroke: "#999", strokeWidth: 1 }), // 连接线本身
      $(go.Shape, { toArrow: "Standard", fill: "#999", scale: 1.5 }) // 箭头
      // $(go.TextBlock, // 标签
      //   { segmentOffset: new go.Point(0, 15), segmentIndex: 1, font: "12px sans-serif" },
      //   new go.Binding("text", "label")
      // )
    );

    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);


    return diagram;
  },
};

function makeItemTemplate($:any) {
    return $(go.Panel, "TableRow", 
        $(go.TextBlock,
            { column: 0, font: "12px sans-serif", stroke: "#666", margin: new go.Margin(2, 8, 2, 8) },
            new go.Binding("text", "name")
        ),
        $(go.TextBlock,
            { column: 1, font: "12px sans-serif", stroke: "#666", margin: new go.Margin(2, 8, 2, 8) },
            new go.Binding("text", "type")
        ),
        $(go.TextBlock, // PK/FK 标志
            { column: 2, font: "12px sans-serif", stroke: "#666", margin: new go.Margin(2, 8, 2, 8) },
            new go.Binding("text", "", (col: any) => (col.pk ? "P" : col.fk ? "F" : ""))
        )
    );
}

const nodeAdornmentTemplate = $(go.Adornment, "Spot",
    $(go.Panel, "Auto",
        $(go.Shape, { fill: null, stroke: "dodgerblue", strokeWidth: 2 }),
        $(go.Placeholder)
    )
);


export default conponents;
