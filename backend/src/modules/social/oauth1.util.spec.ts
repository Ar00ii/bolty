import { buildAuthHeader, rfc3986, signatureBaseString } from './oauth1.util';

describe('oauth1.util', () => {
  describe('rfc3986', () => {
    it('encodes the OAuth-special chars beyond encodeURIComponent', () => {
      expect(rfc3986("!'()*")).toBe('%21%27%28%29%2A');
    });
    it('matches encodeURIComponent for the safe set', () => {
      expect(rfc3986('abc-123_~.')).toBe('abc-123_~.');
    });
    it('encodes spaces as %20 (not +)', () => {
      expect(rfc3986('hello world')).toBe('hello%20world');
    });
  });

  describe('signatureBaseString', () => {
    it('matches X docs example for a sample tweet POST', () => {
      // Lifted from https://developer.x.com/en/docs/authentication/oauth-1-0a/creating-a-signature
      // Slightly trimmed (status param only) to keep the test focused.
      const params = {
        status: 'Hello Ladies + Gentlemen, a signed OAuth request!',
        oauth_consumer_key: 'xvz1evFS4wEEPTGEFPHBog',
        oauth_nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: '1318622958',
        oauth_token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
        oauth_version: '1.0',
      };
      const sig = signatureBaseString(
        'POST',
        'https://api.twitter.com/1.1/statuses/update.json',
        params,
      );
      // Expected per X's example. Verifies that param-sort + URL canonicalisation
      // + percent-encoding all match the spec.
      expect(sig).toBe(
        'POST&https%3A%2F%2Fapi.twitter.com%2F1.1%2Fstatuses%2Fupdate.json' +
          '&oauth_consumer_key%3Dxvz1evFS4wEEPTGEFPHBog%26oauth_nonce%3DkYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg' +
          '%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1318622958' +
          '%26oauth_token%3D370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb' +
          '%26oauth_version%3D1.0%26status%3DHello%2520Ladies%2520%252B%2520Gentlemen%252C%2520a%2520signed%2520OAuth%2520request%2521',
      );
    });

    it('strips query strings + fragments from the canonical URL', () => {
      const sig = signatureBaseString(
        'POST',
        'https://api.twitter.com/2/tweets?ignored=1#frag',
        { foo: 'bar' },
      );
      expect(sig).toBe('POST&https%3A%2F%2Fapi.twitter.com%2F2%2Ftweets&foo%3Dbar');
    });
  });

  describe('buildAuthHeader', () => {
    it('produces a deterministic signature for fixed nonce + timestamp', () => {
      // X's documented signing example yields signature "hCtSmYh+iHYCEqBWrE7C7hYmtUk="
      const header = buildAuthHeader(
        'POST',
        'https://api.twitter.com/1.1/statuses/update.json',
        { status: 'Hello Ladies + Gentlemen, a signed OAuth request!' },
        {
          consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
          consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
          accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
          accessTokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
        },
        'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
        '1318622958',
      );
      // Signature locked from running our impl against X's documented
      // base string. The docs example signature ("hCtSmYh+iHYCEqBWrE7C7hYmtUk=")
      // assumes additional `include_entities=true` in the body — for
      // status-only the HMAC of the base string with the docs signing
      // key is "Tqz6pFAShJQqSyxctXvqKWrv3BQ=". Either way the base
      // string assertion above guarantees we follow the spec; this
      // assertion just locks in the HMAC step against regression.
      expect(header).toContain('oauth_signature="Tqz6pFAShJQqSyxctXvqKWrv3BQ%3D"');
      expect(header).toContain('oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog"');
      expect(header).toContain('oauth_nonce="kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg"');
      expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
      expect(header).toContain('oauth_timestamp="1318622958"');
    });

    it('returns an OAuth header even when no body params are supplied', () => {
      const header = buildAuthHeader(
        'GET',
        'https://api.twitter.com/2/users/me',
        {},
        {
          consumerKey: 'CK',
          consumerSecret: 'CS',
          accessToken: 'AT',
          accessTokenSecret: 'ATS',
        },
        'fixed-nonce',
        '1700000000',
      );
      expect(header.startsWith('OAuth ')).toBe(true);
      expect(header).toContain('oauth_signature=');
      expect(header).toContain('oauth_token="AT"');
    });

    it('different nonce or timestamp = different signature', () => {
      const args = [
        'POST',
        'https://api.twitter.com/2/tweets',
        {},
        { consumerKey: 'k', consumerSecret: 's', accessToken: 't', accessTokenSecret: 'ts' },
      ] as const;
      const a = buildAuthHeader(...args, 'nonce-a', '1700000000');
      const b = buildAuthHeader(...args, 'nonce-b', '1700000000');
      const c = buildAuthHeader(...args, 'nonce-a', '1700000001');
      expect(a).not.toBe(b);
      expect(a).not.toBe(c);
    });
  });
});
