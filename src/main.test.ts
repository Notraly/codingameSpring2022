import * as fs from 'fs';
import { run } from "./main";

function useFileAsReadline(path: string){
  let data = fs.readFileSync(path, 'utf8').split('\n');

  if(data[0].startsWith("Sortie d'erreur")) data.splice(0,1);
  const errOutIndex = data.findIndex((row) => row.startsWith("Sortie d'erreur"));
  if(errOutIndex > -1){
    const nbRound = data[errOutIndex -1 ];
    data = data.filter((row, index) => !row.startsWith("Sortie d'erreur") && row !== nbRound && data[index+1] !== nbRound);
  }

  global.readline = () => data.shift();
}

describe("run", () => {
  it("should be a function", () => {
    expect(typeof run).toBe("function");
  });
  it("test run with input file", () => {
    useFileAsReadline('./src/test.txt');
    run();
  });
});
