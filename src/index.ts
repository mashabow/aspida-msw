import { ResponseResolver, rest } from 'msw';
import { LowerHttpMethod } from 'aspida';
import { $LowerHttpMethod, ApiInstance, Api, Endpoint, MockApi } from './type';

const METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'head',
  'patch',
  'options',
] satisfies LowerHttpMethod[];
const $METHODS = [
  '$get',
  '$post',
  '$put',
  '$delete',
  '$head',
  '$patch',
  '$options',
] satisfies $LowerHttpMethod[];

function createMock<
  TApiInstance extends ApiInstance,
  TPathParamName extends string,
>(apiInstance: TApiInstance): MockApi<TApiInstance, TPathParamName> {
  // @ts-expect-error TODO: 型エラー修正
  return Object.entries(apiInstance).reduce(
    // @ts-expect-error TODO: 型エラー修正
    (acc, [key, value]) => {
      if (value instanceof Function) {
        if (key === '$path') {
          return { ...acc, $path: value };
        }

        if ($METHODS.includes(key as $LowerHttpMethod)) {
          // そのメソッドのモック生成関数を返す
          const method = key.substring(1) as LowerHttpMethod;
          const path = (apiInstance as Endpoint).$path();
          return {
            ...acc,
            [key]: (resolver: ResponseResolver) => rest[method](path, resolver),
          };
        }

        if (METHODS.includes(key as LowerHttpMethod)) {
          // `$` 無しのメソッドは、モックには用意しない
          return acc;
        }

        if (key.startsWith('_')) {
          // 次の階層がパスパラメータ（e.g. `_foo`）の場合、パスを MSW の形式（`:foo`）に変換した上で、再帰的にモックを作る
          const paramName = key.substring(1);
          // @ts-expect-error TODO: 型エラー修正
          const childApiInstance = value(`:${paramName}`) as ApiInstance;
          return { ...acc, [key]: createMock(childApiInstance) };
        }

        return acc; // ここには来ないはず
      }

      // サブパスのモックを再帰的に作る
      return { ...acc, [key]: createMock(value) };
    },
    {} as MockApi<TApiInstance, TPathParamName>,
  );
}

export function createTypedRest<TApiInstance extends ApiInstance>(
  api: Api<TApiInstance>,
  baseURL?: string,
): MockApi<TApiInstance, never> {
  const apiInstance = api({
    baseURL,
    // @ts-expect-error 使わないので適当な関数を渡しておく
    fetch: () => 'dummy',
  });

  return createMock(apiInstance);
}
