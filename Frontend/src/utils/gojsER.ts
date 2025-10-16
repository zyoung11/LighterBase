import * as godraw from "gojs"

const $ = godraw.GraphObject.make; 
let currentDiagram: any = null;

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


const gojsER = {

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

    if (currentDiagram) {
      currentDiagram.div = null; 
    }

    container.innerHTML = '';

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

    const diagram = $(godraw.Diagram, mountId, 
      {
        initialAutoScale: godraw.Diagram.Uniform,
        layout: $(godraw.LayeredDigraphLayout,
          { direction: 0, layerSpacing: 80, columnSpacing: 60 } 
        ),
        "undoManager.isEnabled": true, 
      }
    );

    currentDiagram = diagram;

    diagram.nodeTemplate = $(godraw.Node, "Auto",
        {
          selectionAdornmentTemplate: nodeAdornmentTemplate,
          locationSpot: godraw.Spot.Center,
          resizable: true,
          fromSpot: godraw.Spot.AllSides,
          toSpot: godraw.Spot.AllSides,
        },
        $(godraw.Shape, "RoundedRectangle", {
            stroke: "#5B8FF9", 
            fill: "#fff", 
            strokeWidth: 2,
        }),
        $(godraw.Panel, "Table",
            {
                defaultAlignment: godraw.Spot.Left,
                margin: 4,
            },
            $(godraw.RowColumnDefinition, { row: 0, column: 0,  separatorStroke: "#a4b1ddff", separatorPadding: 4 }),
            $(godraw.TextBlock,
                { row: 0, column: 0, columnSpan: 3, font: "bold 14px sans-serif", stroke: "#faf9f9ff", background: "#5B8FF9", alignment: godraw.Spot.Center, stretch: godraw.GraphObject.Horizontal, margin: 4 },
                new godraw.Binding("text", "name")
            ),
            $(godraw.Panel, "Table",
                {
                    row: 1, column: 0, columnSpan: 3,
                    itemTemplate: makeItemTemplate($), 
                },
                new godraw.Binding("itemArray", "columns")
            )
        )
    );

    diagram.linkTemplate = $(godraw.Link,
      { routing: godraw.Link.AvoidsNodes, curve: godraw.Link.JumpOver },
      $(godraw.Shape, { stroke: "#999", strokeWidth: 1 }),
      $(godraw.Shape, { toArrow: "Standard", fill: "#999", scale: 1.5 })
    );

    diagram.model = new godraw.GraphLinksModel(nodeDataArray, linkDataArray);

    return diagram;
  },
};

function makeItemTemplate($:any) {
    return $(godraw.Panel, "TableRow", 
        $(godraw.TextBlock,
            { column: 0, font: "12px sans-serif", stroke: "#666", margin: new godraw.Margin(2, 8, 2, 8) },
            new godraw.Binding("text", "name")
        ),
        $(godraw.TextBlock,
            { column: 1, font: "12px sans-serif", stroke: "#666", margin: new godraw.Margin(2, 8, 2, 8) },
            new godraw.Binding("text", "type")
        ),
        $(godraw.TextBlock, // PK/FK 标志
            { column: 2, font: "12px sans-serif", stroke: "#666", margin: new godraw.Margin(2, 8, 2, 8) },
            new godraw.Binding("text", "", (col: any) => (col.pk ? "P" : col.fk ? "F" : ""))
        )
    );
}

const nodeAdornmentTemplate = $(godraw.Adornment, "Spot",
    $(godraw.Panel, "Auto",
        $(godraw.Shape, { fill: null, stroke: "dodgerblue", strokeWidth: 2 }),
        $(godraw.Placeholder)
    )
);


export default gojsER
