/** Exact kopecks for sums and reconciliation; input comes from validated API decimals. */
export function kopecks(value:string):number{
  const negative=value.startsWith("-");
  const [whole,fraction=""]=value.replace(/^[-+]/,"").split(".");
  return (Number(whole)*100+Number(fraction.padEnd(2,"0").slice(0,2)))*(negative?-1:1);
}
export function sumMoney(values:string[]):string{return (values.reduce((sum,value)=>sum+kopecks(value),0)/100).toFixed(2);}
