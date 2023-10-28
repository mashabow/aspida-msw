import { describe, expect, test } from 'vitest';
import { RestHandler } from 'msw';
import { createTypedRest } from '.';
import { Api } from './type';

describe('mswpida', () => {
  const baseURL = 'https://base-url.example.com/v1';

  test('空のAPI', () => {
    const api = (() => ({})) satisfies Api;
    const typedRest = createTypedRest(api, baseURL);
    expect(typedRest).toEqual({});
  });

  describe('エンドポイントのパスを $path() で取得できる', () => {
    test('パスパラメータを含まない場合', () => {
      const api = (({ baseURL: _baseURL }) => ({
        $get: () => Promise.resolve(''),
        $path: () => `${_baseURL}/`,
        foo: {
          $get: () => Promise.resolve(''),
          $path: () => `${_baseURL}/foo`,
          bar: {
            $get: () => Promise.resolve(''),
            $path: () => `${_baseURL}/foo/bar`,
          },
        },
        hoge: {
          // hoge にはエンドポイントがない
          piyo: {
            $get: () => Promise.resolve(''),
            $path: () => `${_baseURL}/hoge/piyo`,
          },
        },
      })) satisfies Api;
      const typedRest = createTypedRest(api, baseURL);

      expect(typedRest.$path()).toEqual(`${baseURL}/`);
      expect(typedRest.foo.$path()).toEqual(`${baseURL}/foo`);
      expect(typedRest.foo.bar.$path()).toEqual(`${baseURL}/foo/bar`);
      expect(typedRest.hoge.piyo.$path()).toEqual(`${baseURL}/hoge/piyo`);

      // hoge にはエンドポイントがないので、$path は存在しない
      expect(typedRest.hoge).not.toHaveProperty('$path');
    });

    test('パスパラメータを含む場合', () => {
      const api = (({ baseURL: _baseURL }) => ({
        items: {
          _itemId: (itemId: string) => ({
            $get: () => Promise.resolve(''),
            $path: () => `${_baseURL}/items/${itemId}`,
            variants: {
              $get: () => Promise.resolve(''),
              $path: () => `${_baseURL}/items/${itemId}/variants`,
              _variantId: (variantId: number) => ({
                $get: () => Promise.resolve(''),
                $path: () =>
                  `${_baseURL}/items/${itemId}/variants/${variantId}`,
              }),
            },
          }),
        },
      })) satisfies Api;
      const typedRest = createTypedRest(api, baseURL);

      expect(typedRest.items._itemId.$path()).toEqual(
        `${baseURL}/items/:itemId`,
      );
      expect(typedRest.items._itemId.variants.$path()).toEqual(
        `${baseURL}/items/:itemId/variants`,
      );
      expect(typedRest.items._itemId.variants._variantId.$path()).toEqual(
        `${baseURL}/items/:itemId/variants/:variantId`,
      );
    });
  });

  test('エンドポイントの request handler を $get() などで作成できる', () => {
    const api = (({ baseURL: _baseURL }) => ({
      items: {
        _itemId: (itemId: string) => ({
          $get: () => Promise.resolve({ foo: 'bar' }),
          $path: () => `${_baseURL}/items/${itemId}`,
          variants: {
            $get: () => Promise.resolve({ foo: 'bar' }),
            $path: () => `${_baseURL}/items/${itemId}/variants`,
            _variantId: (variantId: number) => ({
              $get: () => Promise.resolve({ foo: 'bar' }),
              $path: () => `${_baseURL}/items/${itemId}/variants/${variantId}`,
            }),
          },
        }),
      },
    })) satisfies Api;
    const typedRest = createTypedRest(api, baseURL);
    const handler = typedRest.items._itemId.variants._variantId.$get(
      (_req, res, ctx) => res.once(ctx.status(200), ctx.json({ foo: 'baz' })),
    );

    expect(handler).toBeInstanceOf(RestHandler);
  });

  test('`req.params` にパスパラメータの型がつく', () => {
    const api = (({ baseURL: _baseURL }) => ({
      items: {
        _itemId: (itemId: string) => ({
          $get: () => Promise.resolve({ foo: 'bar' }),
          $path: () => `${_baseURL}/items/${itemId}`,
          variants: {
            $get: () => Promise.resolve({ foo: 'bar' }),
            $path: () => `${_baseURL}/items/${itemId}/variants`,
            _variantId: (variantId: number) => ({
              $get: () => Promise.resolve({ foo: 'bar' }),
              $path: () => `${_baseURL}/items/${itemId}/variants/${variantId}`,
            }),
          },
        }),
      },
    })) satisfies Api;
    const typedRest = createTypedRest(api, baseURL);
    const handler = typedRest.items._itemId.variants._variantId.$get(
      (req, res, ctx) => {
        const itemId = req.params.itemId satisfies string;
        const variantId = req.params.variantId satisfies string;
        return res(
          ctx.status(200),
          ctx.json({ foo: 'baz', itemId, variantId }),
        );
      },
    );

    expect(handler).toBeInstanceOf(RestHandler);
  });
});
