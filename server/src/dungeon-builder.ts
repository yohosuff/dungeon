import * as ROT from 'rot-js';

export class DungeonBuilder {
    getDungeon(): number[][] {
        
        const rowCount = 100;
        const colCount = 100;

        const dungeon = [];

        for(let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
            const row = [];
            
            for(let colIndex = 0; colIndex < colCount; ++colIndex) {
                row.push(0);
            }

            dungeon.push(row);
        }

        const typeMap = new Map<number,number>();
        typeMap.set(1,0);
        typeMap.set(0,1);

        const map = new ROT.Map.Digger(colCount, rowCount, {});
        map.create((x, y, type) => {
            // dungeon[y][x] = typeMap.get(type);
            dungeon[y][x] = 1;
        });

        console.log(dungeon.length);

        return dungeon;
    }
}