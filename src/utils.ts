export async function delay(ms:number):Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export async function time<T>(operation:(()=>Promise<T>)):Promise<[bigint, T]> {
  const start = process.hrtime.bigint();
  const result = await operation();
  const end = process.hrtime.bigint();
  return [end - start, result];
}

export function getOrSet<T>(inObject:T, key:keyof T, generator:()=>any):any {
  let value:any = inObject[key];
  if(value == null) {
    value = generator();
    inObject[key] = value;
  }
  return value;
}