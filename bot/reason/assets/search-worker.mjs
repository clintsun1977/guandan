// <define:__MODEL_VERSIONS__>
var define_MODEL_VERSIONS_default = { "bot:017": "462afc99ee6bcfb7", "belief:9001": "16d767830e453618" };

// web/src/ai/search-worker.mjs
import * as ort from "./vendor/ort.wasm.min.mjs";

// web/src/ai/model-catalog.json
var model_catalog_default = {
  schema: 1,
  defaultId: "017",
  models: [
    {
      id: "001",
      file: "policy.onnx",
      sha256: "d5038709af116c779e7f6a014ea1a68aab6a1a0026fddcf19862881d060e0422",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        version: "P0",
        status: "baseline"
      }
    },
    {
      id: "002",
      file: "bot-002.onnx",
      sha256: "260895a254dcffb7a9cd9d22ba4ee3e74c183711e9108611ea3772eb3af5af75",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-002/bot-002.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000198487",
        step: 198487,
        exportedAt: "2026-11-05T04:47:20Z",
        expectedSHA256: "260895a254dcffb7a9cd9d22ba4ee3e74c183711e9108611ea3772eb3af5af75",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T04:52:28.151Z"
      }
    },
    {
      id: "003",
      file: "bot-003.onnx",
      sha256: "15ae4809731d843fdfca74ba5a5bd1cc30ed00cb2de9f110ee1ca0299a12127b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-003/bot-003.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000009537",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T05:15:35.468Z",
        step: 9537
      }
    },
    {
      id: "004",
      file: "bot-004.onnx",
      sha256: "a806747de50a46f76bd8b4d5de189411b902f3b46531e040daf19c76fdbd7da7",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-004/bot-004.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000331516",
        step: 331516,
        exportedAt: "2026-11-05T08:50:45Z",
        expectedSHA256: "a806747de50a46f76bd8b4d5de189411b902f3b46531e040daf19c76fdbd7da7",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T08:54:34.926Z"
      }
    },
    {
      id: "005",
      file: "bot-005.onnx",
      sha256: "ff06717ee04155f780ccca45136f537ffd7704386125a70c91dd04630ae713af",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-005/bot-005.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000027771",
        status: "experimental-not-heldout-accepted",
        step: 27771,
        registeredAt: "2026-11-05T09:17:33.468Z"
      }
    },
    {
      id: "006",
      file: "bot-006.onnx",
      sha256: "6a31c7a9e80498fb13adc2bd210583686de5c59abe68a7eb8b1d7d1f6d06b0da",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-006/bot-006.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000481076",
        step: 481076,
        exportedAt: "2026-11-05T12:51:36Z",
        expectedSHA256: "6a31c7a9e80498fb13adc2bd210583686de5c59abe68a7eb8b1d7d1f6d06b0da",
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T12:55:17.396Z"
      }
    },
    {
      id: "007",
      file: "bot-007.onnx",
      sha256: "7ec0450d793b885bb0f7d9c1aa9871fed95df29a6173a8b4c799e1c362027a41",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-007/bot-007.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000044752",
        status: "experimental-not-heldout-accepted",
        step: 44752,
        registeredAt: "2026-11-05T13:18:12.809Z"
      }
    },
    {
      id: "008",
      file: "bot-008.onnx",
      sha256: "5a6a250b10ed33eea151a7dcae4e6396d36d8737107965db98d58912ec5b9af2",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-008/bot-008.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000091092",
        step: 91092,
        status: "experimental-not-heldout-accepted",
        registeredAt: "2026-11-05T14:37:31Z",
        champion: {
          gate: 104,
          acceptedAt: "2026-11-05T01:06:47.980Z",
          evidence: "ai/research/evaluation/champion-selection-20261105/gate-00104.json",
          evidenceSHA256: "6bb880e5063a73fd34e234348330c2b87941bde28594d3a4e88b227f4f77ae2a"
        }
      }
    },
    {
      id: "009",
      file: "bot-009.onnx",
      sha256: "104ca1cb8bcd63fffc3214148031e50054c5a3e13cdbfcc2a9eda26bba0ba2eb",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-009/bot-009.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "gpu-main",
        version: "v000293055",
        status: "experimental-not-heldout-accepted",
        step: 293055,
        registeredAt: "2026-11-05T14:39:20.461Z",
        champion: {
          gate: 112,
          acceptedAt: "2026-11-05T08:11:50.077Z",
          evidence: "ai/research/evaluation/champion-selection-20261105/gate-00112.json",
          evidenceSHA256: "7e58ee57fadc5d7a0898ae0fcf952e4f7ad720adb01f34fcf91ea6d1a7a555a7"
        }
      }
    },
    {
      id: "010",
      file: "bot-010.onnx",
      sha256: "6fb37ef5c25059d550fd36d00459af6ddc20d83127da663800663f0457c45fbe",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-010/bot-010.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000061045",
        status: "experimental-not-heldout-accepted",
        step: 61045,
        registeredAt: "2026-11-05T17:15:32.032Z"
      }
    },
    {
      id: "011",
      file: "bot-011.onnx",
      sha256: "3cb8d3672bb014399cf8500940f6d27506eba0ede9540b46df7c5ac60c4f87a0",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-011/bot-011.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000078087",
        status: "experimental-not-heldout-accepted",
        step: 78087,
        registeredAt: "2026-11-05T21:44:57.015Z"
      }
    },
    {
      id: "012",
      file: "bot-012.onnx",
      sha256: "13b7a9373e9305bffa6e3c4d2b50532a306d75da8e67219ed1bfba9f9d68d0b2",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-012/bot-012.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "mac-20261105",
        version: "v000705434",
        status: "experimental-not-heldout-accepted",
        step: 705434,
        registeredAt: "2026-11-06T01:15:05.171Z",
        champion: {
          gate: 309,
          acceptedAt: "2026-11-06T00:22:21.010Z",
          evidence: "ai/research/evaluation/champion-selection-mac-20261105/gate-00309.json",
          evidenceSHA256: "9d0dddb9e67895a0c45aa0c4be76b7317a2dccc3b9fb635bb024781fb763e86c",
          manifest: "ai/research/evaluation/champion-selection-mac-20261105/champion.json"
        },
        trainingDevice: "mps"
      }
    },
    {
      id: "013",
      file: "bot-013.onnx",
      sha256: "041526bfe80612c48cd609b0b4a1e16095ea2d9c52bada3a888e55734f9ba696",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-013/bot-013.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-gpubatch",
        version: "model-000000081302",
        status: "experimental-not-heldout-accepted",
        step: 81302,
        registeredAt: "2026-11-06T01:46:25.967Z"
      }
    },
    {
      id: "014",
      file: "bot-014.onnx",
      sha256: "b752ee8b8cfc572aae50c2b0fecc0e20f0db29f9d2309b14cb14d7f153e5d5d1",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-014/bot-014.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000104257",
        status: "experimental-not-heldout-accepted",
        step: 104257,
        registeredAt: "2026-11-06T05:42:10.604Z"
      }
    },
    {
      id: "015",
      file: "bot-015.onnx",
      sha256: "8ede9a08a84ad0acaff74c24c8e7287d3da7d19e86f846e0052c6c6d620051ba",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-015/bot-015.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000120154",
        status: "experimental-not-heldout-accepted",
        step: 120154,
        registeredAt: "2026-11-06T09:47:52.777Z"
      }
    },
    {
      id: "016",
      file: "bot-016.onnx",
      sha256: "c24f03730ad4e76f6acd91430374c3755058e118d1bf85ff207548ae4852b2bd",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-016/bot-016.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000135205",
        status: "experimental-not-heldout-accepted",
        step: 135205,
        registeredAt: "2026-11-06T13:46:09.173Z"
      }
    },
    {
      id: "017",
      file: "bot-017.onnx",
      sha256: "462afc99ee6bcfb788871d7a8f84d4298c008d57465c62d48ca1792cdb11b3f7",
      bytes: 5368650,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-017/bot-017.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54
      },
      source: {
        run: "mac-20261105",
        version: "v000855042",
        status: "experimental-not-heldout-accepted",
        step: 855042,
        registeredAt: "2026-11-06T15:28:31.478Z",
        champion: {
          gate: 330,
          acceptedAt: "2026-11-06T10:59:34.199Z",
          evidence: "ai/research/evaluation/champion-selection-mac-20261106/gate-00330.json",
          evidenceSHA256: "c151c57b37f905084c8374ae8868bbfd3eb90763b60aed7eb4f0b640bb561f3e",
          manifest: "ai/research/evaluation/champion-selection-mac-20261106/champion.json"
        },
        trainingDevice: "mps"
      }
    },
    {
      id: "018",
      file: "bot-018.onnx",
      sha256: "a9faa1898f6a5846aaa03a31a82249e25fc4f163b6f1da44a35d2ce2f006f65f",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-018/bot-018.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000138506",
        status: "experimental-not-heldout-accepted",
        step: 138506,
        registeredAt: "2026-11-07T03:13:06.962Z"
      }
    },
    {
      id: "019",
      file: "bot-019.onnx",
      sha256: "bb745cbf44b4a0f648ef93998b60f1f02211d5a4bdd4176b02cf607d6e26d754",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-019/bot-019.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000186280",
        status: "experimental-not-heldout-accepted",
        step: 186280,
        registeredAt: "2026-11-07T03:49:42.557Z"
      }
    },
    {
      id: "020",
      file: "bot-020.onnx",
      sha256: "435e5d494444fcdd73637c3c847706b4fcc46fd92bd9f70124339ef66d26dba7",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-020/bot-020.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000223067",
        status: "experimental-not-heldout-accepted",
        step: 223067,
        registeredAt: "2026-11-07T15:17:13.950Z"
      }
    },
    {
      id: "021",
      file: "bot-021.onnx",
      sha256: "43d72b65e773fb5acb6b8f86baed16a69a1977a97fb6fddf4fe5f23ee25261bc",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-021/bot-021.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000229609",
        status: "experimental-not-heldout-accepted",
        step: 229609,
        registeredAt: "2026-11-07T15:43:18.522Z"
      }
    },
    {
      id: "022",
      file: "bot-022.onnx",
      sha256: "00a1ec91244392963cf681d5d02ead66ab6b42be3bd504daed943df0613ca15b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-022/bot-022.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000270292",
        status: "experimental-not-heldout-accepted",
        step: 270292,
        registeredAt: "2026-11-08T03:43:32.307Z"
      }
    },
    {
      id: "023",
      file: "bot-023.onnx",
      sha256: "e02bd26f3d90cb9ef90f7075ad1acd845c709bebac734611c44eb66d48fdbd4b",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-023/bot-023.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000303975",
        status: "experimental-not-heldout-accepted",
        step: 303975,
        registeredAt: "2026-11-08T15:13:05.630Z"
      }
    },
    {
      id: "024",
      file: "bot-024.onnx",
      sha256: "86dad83347535f38f7c131bb567b34b5f875cf2f613675d22605600fdb18b863",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-024/bot-024.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000310956",
        status: "experimental-not-heldout-accepted",
        step: 310956,
        registeredAt: "2026-11-08T15:40:14.563Z"
      }
    },
    {
      id: "025",
      file: "bot-025.onnx",
      sha256: "aa1bfd7fe972739ae6ea3c0f321379dd36360f1ab274765a0e42df8568b877b5",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-025/bot-025.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000352359",
        status: "experimental-not-heldout-accepted",
        step: 352359,
        registeredAt: "2026-11-09T03:42:10.298Z"
      }
    },
    {
      id: "026",
      file: "bot-026.onnx",
      sha256: "21300c36c7c273b43274a83fa70dc62ce85be0cc84decc6dda2080548e0096b1",
      bytes: 6346014,
      url: "https://github.com/stevensun1005/guandanai/releases/download/web-model-026/bot-026.onnx",
      config: {
        stateFeatures: 513,
        actionFeatures: 54,
        history: "guanzero-v1"
      },
      source: {
        run: "guanzero-adp-io48",
        version: "model-000000385979",
        status: "experimental-not-heldout-accepted",
        step: 385979,
        registeredAt: "2026-11-09T13:29:15.336Z"
      }
    }
  ],
  selection: {
    mode: "latest-v2",
    danMCaiChampions: [
      "017",
      "012"
    ],
    defaultChoice: "9001"
  },
  searchBots: [
    {
      id: "9001",
      kind: "belief-search",
      base: "017",
      belief: {
        file: "belief-v1-16d76783.onnx",
        sha256: "16d767830e4536180fac56d744e95934b7525ab67b18d27df4f33066033d65e9",
        bytes: 3931285,
        url: "https://github.com/stevensun1005/guandanai/releases/download/web-belief-v1-16d76783/belief-v1-16d76783.onnx",
        featureVersion: "belief-v1",
        trainReportSHA256: "7f022c7640e0102dd25bfe497b6c0bc2dc1e3480dc1dfcf5144fa73ab6c95f0d",
        trainingSeeds: [
          4255121e3,
          4255160999
        ],
        trainingBand: [
          21,
          80
        ]
      },
      search: {
        lo: 21,
        hi: 40,
        worlds: 8,
        k: 6,
        net: 2,
        endgameHi: 20,
        endgameWorlds: 8,
        minWorlds: 4,
        tieTolerance: 1e-9,
        solverMaxNodes: 15e5,
        worldSeed: "(seed*1009 + ply*7919)>>>0"
      },
      version: "v000855042-bsearch1-16d76783",
      sha256: "442d888ada3b59c56cb1e809bb24a97268f00c3daaa6345c6b53f2f84aca6a24",
      source: {
        status: "research-bot-not-champion-deployment-not-acceptance",
        tested: "Node bot midgame-search.mjs --worlds-source=belief --endgame=pimc --endgame-hi=20 --endgame-worlds=belief; held-out H4 990,023,757-990,026,756: +0.237 [0.208, 0.266] mean signed round points per deal pair vs champion-017 opponents, single rounds, no tribute; H3 midgame only +0.139 [0.111, 0.166]",
        scope: "validated only vs champion-017 opponents in single rounds without tribute; untested vs humans, human partners, mixed teams or tribute rounds; browser budget overruns play champion 017",
        evidence: [
          {
            file: "ai/research/evaluation/window2-20261109/results/C-h4.json",
            sha256: "17cf1dcf969ae0a1c9ffd0ab1bdbe58b349aafd9dfadccd5900e30ecd76075be"
          },
          {
            file: "ai/research/evaluation/window1-20261109/results/H3-compare.json",
            sha256: "876bb00067cb47783534c0577f9e42641aa096b53fca9ee884737b35baf08b4e"
          }
        ],
        deployment: "ai/research/evaluation/web-search-bot-9001.json",
        authorizedAt: "2026-11-09"
      }
    }
  ]
};

// web/src/ai/turn-timing.mjs
var REASON_MS = 5e4;

// web/src/ai/search/constants.mjs
var SEARCH_BOT_V1 = Object.freeze({
  lo: 21,
  hi: 40,
  worlds: 8,
  k: 6,
  net: 2,
  endgameHi: 20,
  endgameWorlds: 8,
  minWorlds: 4,
  tieTolerance: 1e-9,
  solverMaxNodes: 15e5,
  worldSeed: "(seed*1009 + ply*7919)>>>0"
});
function searchBand(cards, params = SEARCH_BOT_V1) {
  if (cards >= params.lo && cards <= params.hi) return "midgame";
  if (cards <= params.endgameHi) return "endgame";
  return null;
}
var worldSeed = (seed, ply) => seed * 1009 + ply * 7919 >>> 0;
var SEARCH_BUDGETS = Object.freeze({
  desktop: Object.freeze({
    midgameMs: REASON_MS,
    endgameMs: REASON_MS,
    solverMs: 3e3,
    solverTable: 3e5
  }),
  mobile: Object.freeze({
    midgameMs: REASON_MS,
    endgameMs: REASON_MS,
    solverMs: 3e3,
    solverTable: 1e5
  })
});
var NODE_SOLVER_MS = 3e3;

// web/src/ai/model-catalog.mjs
var MENU_MODE = "latest-v2";
var CLINT_RULE_ID = "clint-rule";
var RELEASE_ASSET = /^https:\/\/github\.com\/stevensun1005\/guandanai\/releases\/download\/[^/]+\/[\w.-]+\.onnx$/;
var sameParams = (a, b) => !!a && Object.keys(a).length === Object.keys(b).length && Object.entries(b).every(([key, v]) => a[key] === v);
function validateSearchBots(value) {
  const bots = value.searchBots ?? [];
  if (!Array.isArray(bots)) throw Error("Invalid search bots");
  const ids = new Set(value.models.map((m) => m.id)), files = new Set(value.models.map((m) => m.file));
  for (const bot of bots) {
    const base = value.models.find((m) => m.id === bot.base);
    if (!/^\d{3,}$/.test(bot.id) || ids.has(bot.id) || bot.kind !== "belief-search" || !base || base.config.history || base.config.extraFeatures || !Number.isInteger(base.source?.champion?.gate) || !/^belief-[\w-]+\.onnx$/.test(bot.belief?.file) || files.has(bot.belief.file) || !/^[a-f0-9]{64}$/.test(bot.belief.sha256) || !RELEASE_ASSET.test(bot.belief.url) || bot.belief.featureVersion !== "belief-v1" || !/^[a-f0-9]{64}$/.test(bot.sha256) || typeof bot.version !== "string" || !/^[\w.-]{1,80}$/.test(bot.version) || !sameParams(bot.search, SEARCH_BOT_V1) || value.defaultId === bot.id)
      throw Error("Invalid or duplicate search bot entry");
    ids.add(bot.id);
    files.add(bot.belief.file);
  }
}
function validateCatalog(value) {
  if (value?.schema !== 1 || !Array.isArray(value.models) || !value.models.length)
    throw Error("Invalid model catalog");
  const ids = /* @__PURE__ */ new Set(), files = /* @__PURE__ */ new Set();
  for (const model of value.models) {
    if (!/^\d{3,}$/.test(model.id) || ids.has(model.id) || !/^[\w-]+\.onnx$/.test(model.file) || files.has(model.file) || !/^[a-f0-9]{64}$/.test(model.sha256) || model.config?.stateFeatures !== 513 || model.config?.actionFeatures !== 54 || model.config.extraFeatures && ![53, 61].includes(model.config.extraFeatures) || model.config.history && model.config.history !== "guanzero-v1")
      throw Error("Invalid or duplicate model entry");
    if (model.url && !RELEASE_ASSET.test(model.url))
      throw Error("Model must use a pinned repository Release asset");
    ids.add(model.id);
    files.add(model.file);
  }
  if (!ids.has(value.defaultId)) throw Error("Missing default model");
  if (value.selection) {
    const champions = value.selection.danMCaiChampions;
    if (value.selection.mode !== MENU_MODE || !Array.isArray(champions) || champions.length !== 2 || new Set(champions).size !== 2 || champions.some((id) => {
      const model = value.models.find((m) => m.id === id);
      return !model || model.config.history || !Number.isInteger(model.source?.champion?.gate);
    }) || value.defaultId !== champions[0])
      throw Error("Invalid champion selection");
  }
  validateSearchBots(value);
  validateDefaultChoice(value);
  return value;
}
function validateDefaultChoice(value) {
  const choice = value.selection?.defaultChoice;
  if (choice === void 0) return;
  const bot = (value.searchBots ?? []).find((b) => b.id === choice);
  if (choice !== value.defaultId && bot?.base !== value.selection.danMCaiChampions[0] || !selectableModels(value).some((entry) => entry.id === choice))
    throw Error("Invalid menu default");
}
validateCatalog(model_catalog_default);
var BOT_MODELS = Object.freeze(model_catalog_default.models.map((model) => Object.freeze(model)));
var NEURAL_DEFAULT_MODEL = model_catalog_default.defaultId;
var DEFAULT_BOT_MODEL = model_catalog_default.selection?.defaultChoice ?? model_catalog_default.defaultId;
var SEARCH_BOTS = Object.freeze(
  (model_catalog_default.searchBots || []).map((bot) => Object.freeze(bot))
);
var searchBot = (value) => SEARCH_BOTS.find((bot) => bot.id === value) || null;
var botModelId = (value) => value === CLINT_RULE_ID || BOT_MODELS.some((model) => model.id === value) || SEARCH_BOTS.some((bot) => bot.id === value) ? value : DEFAULT_BOT_MODEL;
var botModel = (value) => {
  if (value === CLINT_RULE_ID) throw Error("Clint rules do not use a neural model");
  const id = botModelId(value);
  const base = searchBot(id)?.base ?? id;
  return BOT_MODELS.find((model) => model.id === base);
};
var botModelName = (value) => {
  if (value === CLINT_RULE_ID) return "Clint规则机器人";
  if (searchBot(value)) return "danMCai-reason-" + botModel(searchBot(value).base).source.version;
  const model = botModel(value);
  if (model.config.history === "guanzero-v1" && model.source?.run) {
    const checkpoint = Number.isSafeInteger(model.source.step) ? `${model.source.step}` : model.source.version;
    return checkpoint ? `${model.source.run}-${checkpoint}` : model.source.run;
  }
  return "danMCai-" + (model.source?.version === "P0" ? "v000000000" : model.source?.version || model.id);
};
function selectableModels(value) {
  const models = value.models;
  if (!value.selection) return models;
  const champion = value.selection.danMCaiChampions[0];
  return [
    { id: CLINT_RULE_ID, kind: "rule" },
    models.filter((m) => m.config.history === "guanzero-v1").at(-1),
    models.find((m) => m.id === champion),
    (value.searchBots || []).filter((bot) => bot.base === champion).at(-1)
  ].filter(Boolean);
}
var BOT_CHOICES = Object.freeze(selectableModels(model_catalog_default));

// web/src/core/cards.js
var SUITS = ["S", "H", "C", "D"];
var SEQS = [
  [5, 1],
  [3, 2],
  [2, 3]
];
var isWild = (c, L) => c.s === "H" && c.r === L;
function makeDeck() {
  const d = [];
  let id = 0;
  for (let k = 0; k < 2; k++) {
    for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ id: id++, s, r });
    d.push({ id: id++, s: "J", r: 16 });
    d.push({ id: id++, s: "J", r: 17 });
  }
  return d;
}

// web/src/core/combinations.js
var isBomb = (p) => p.type === "bomb" || p.type === "sflush" || p.type === "jokers";
var power = (p) => p.type === "jokers" ? 1e4 : p.type === "sflush" ? 550 + p.value : p.n * 100 + p.value;
function seqStarts(nat, w, len, need) {
  const out = [];
  if (nat.length + w !== len * need) return out;
  for (let s = 1; s + len - 1 <= 14; s++) {
    const cnt = {};
    let ok = true;
    for (const c of nat) {
      let p = c.r;
      if (p === 14 && s === 1) p = 1;
      if (p < s || p > s + len - 1) {
        ok = false;
        break;
      }
      cnt[p] = (cnt[p] || 0) + 1;
      if (cnt[p] > need) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(s);
  }
  return out;
}
function analyze(cards, L) {
  const n = cards.length, res = [];
  if (!n) return res;
  const wild = cards.filter((c) => isWild(c, L)), rest = cards.filter((c) => !isWild(c, L));
  const w = wild.length;
  const jok = rest.filter((c) => c.r >= 16), nat = rest.filter((c) => c.r < 16);
  const cnt = {};
  for (const c of nat) cnt[c.r] = (cnt[c.r] || 0) + 1;
  const ranks = Object.keys(cnt).map(Number);
  const v = (r) => r >= 16 ? r : r === L ? 15 : r;
  const add = (type, value) => res.push({ type, value, n });
  if (jok.length) {
    if (n === 1) add("single", jok[0].r);
    else if (n === 2 && jok.length === 2 && jok[0].r === jok[1].r) add("pair", jok[0].r);
    else if (n === 4 && jok.length === 4) add("jokers", 99);
    else if (n === 5 && jok.length === 2 && jok[0].r === jok[1].r && ranks.length === 1 && nat.length + w === 3)
      add("full", v(ranks[0]));
    return res;
  }
  if (ranks.length <= 1) {
    const sv = ranks.length ? v(ranks[0]) : 15;
    if (n === 1) add("single", sv);
    else if (n === 2) add("pair", sv);
    else if (n === 3) add("triple", sv);
    else add("bomb", sv);
  }
  if (n === 5) {
    if (ranks.length === 2) {
      for (const [t, p] of [
        [ranks[0], ranks[1]],
        [ranks[1], ranks[0]]
      ]) {
        if (cnt[t] <= 3 && cnt[p] <= 2) add("full", v(t));
      }
    }
    if (ranks.length === 1 && nat.length === 3 && w === 2 && ranks[0] !== L)
      add("full", v(ranks[0]));
    const ss = seqStarts(nat, w, 5, 1);
    if (ss.length) {
      const top = Math.max(...ss);
      if (new Set(nat.map((c) => c.s)).size <= 1) add("sflush", top);
      else add("straight", top);
    }
  }
  if (n === 6) {
    const a = seqStarts(nat, w, 3, 2);
    if (a.length) add("pairs3", Math.max(...a));
    const b = seqStarts(nat, w, 2, 3);
    if (b.length) add("trip2", Math.max(...b));
  }
  return res;
}
function beats(p, cur) {
  if (!cur) return true;
  const pb = isBomb(p), cb = isBomb(cur);
  if (pb && !cb) return true;
  if (!pb && cb) return false;
  if (pb) return power(p) > power(cur);
  return p.type === cur.type && p.n === cur.n && p.value > cur.value;
}

// web/src/ai/candidates.js
var cardKey = (c) => c.r + c.s;
function choose(cards, n) {
  const out = [];
  function visit(start, picked) {
    if (picked.length === n) {
      out.push(picked);
      return;
    }
    for (let i = start; i <= cards.length - (n - picked.length); i++) {
      if (i > start && cardKey(cards[i]) === cardKey(cards[i - 1])) continue;
      visit(i + 1, picked.concat(cards[i]));
    }
  }
  visit(0, []);
  return out;
}
function candidates(hand, L, cur) {
  const wild = hand.filter((c) => isWild(c, L));
  const by = {};
  for (const c of hand.filter((c2) => !isWild(c2, L))) (by[c.r] ||= []).push(c);
  for (const group of Object.values(by))
    group.sort((a, b) => a.s.localeCompare(b.s) || a.id - b.id);
  const out = [], seen = /* @__PURE__ */ new Set();
  function add(cards) {
    const faces = cards.map(cardKey).sort().join(",");
    for (const a of analyze(cards, L)) {
      if (!beats(a, cur)) continue;
      const key = a.type + ":" + a.value + ":" + faces;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...a, cards, wu: cards.filter((c) => isWild(c, L)).length });
    }
  }
  function groups(rank, n) {
    const result = [];
    for (let w = 0; w <= Math.min(wild.length, n); w++) {
      if (rank >= 16 && w) continue;
      for (const cards of choose(by[rank] || [], n - w)) result.push({ cards, w });
    }
    return result;
  }
  for (let rank = 2; rank <= 17; rank++) {
    if (rank === 15) continue;
    const max = rank >= 16 ? 2 : Math.min(10, (by[rank] || []).length + wild.length);
    for (let n = 1; n <= max; n++)
      for (const g of groups(rank, n)) add(g.cards.concat(wild.slice(0, g.w)));
  }
  const jokers = (by[16] || []).concat(by[17] || []);
  if (jokers.length === 4) add(jokers);
  for (let t = 2; t <= 14; t++)
    for (const triple of groups(t, 3)) {
      for (let p = 2; p <= 17; p++) {
        if (p === t || p === 15) continue;
        for (const pair of groups(p, 2))
          if (triple.w + pair.w <= wild.length) {
            add(triple.cards.concat(pair.cards, wild.slice(0, triple.w + pair.w)));
          }
      }
    }
  for (const [len, need] of SEQS)
    for (let start = 1; start + len - 1 <= 14; start++) {
      let run = function(offset, cards, w) {
        if (offset === len) {
          add(cards.concat(wild.slice(0, w)));
          return;
        }
        const rank = start + offset === 1 ? 14 : start + offset;
        for (const group of groups(rank, need))
          if (w + group.w <= wild.length) {
            run(offset + 1, cards.concat(group.cards), w + group.w);
          }
      };
      run(0, [], 0);
    }
  if (cur) out.push(null);
  return out;
}

// ai/danMCai/endgame/solver.mjs
var MIN = -3;
var MAX = 3;
var SolverBudget = class extends Error {
  constructor(nodes) {
    super("Endgame solver budget exhausted");
    this.nodes = nodes;
  }
};
var faceKey = (hand) => hand.map((card) => card.r * 4 + "SHCDJ".indexOf(card.s)).sort((a, b) => a - b).join(".");
var shapeKey = (play) => play ? `${play.type}:${play.value}:${play.n}` : "-";
var active = (position, seat) => position.hands[seat].length > 0;
function nextActive(position, seat) {
  for (let step2 = 1; step2 <= 4; step2++)
    if (active(position, (seat + step2) % 4)) return (seat + step2) % 4;
  throw Error("No active seat");
}
function step(position, play) {
  const player = position.turn;
  const hands = position.hands.slice();
  let { trick, passes } = position;
  const out = position.out.slice();
  if (play) {
    const remaining = hands[player].slice();
    for (const card of play.cards) {
      const index = remaining.findIndex((held) => held.r === card.r && held.s === card.s);
      if (index < 0) throw Error("Solver play does not come from the moving hand");
      remaining.splice(index, 1);
    }
    hands[player] = remaining;
    if (!hands[player].length) out.push(player);
    trick = { player, play };
    passes = 0;
  } else {
    if (!trick) throw Error("Cannot pass on lead");
    passes++;
  }
  const next = { hands, L: position.L, turn: player, trick, passes, out };
  if (!active(next, 0) && !active(next, 2) || !active(next, 1) && !active(next, 3)) {
    const order = out.slice(), last = order.at(-1);
    for (let k = 1; k <= 4; k++) if (!order.includes((last + k) % 4)) order.push((last + k) % 4);
    const winner = order[0] % 2;
    const matePosition = order.indexOf((order[0] + 2) % 4);
    return {
      result: { winner, points: matePosition === 1 ? 3 : matePosition === 2 ? 2 : 1, order }
    };
  }
  const owner = trick.player;
  const others = [0, 1, 2, 3].filter((seat) => seat !== owner && active(next, seat)).length;
  if (passes >= others) {
    next.turn = active(next, owner) ? owner : active(next, (owner + 2) % 4) ? (owner + 2) % 4 : nextActive(next, owner);
    next.trick = null;
    next.passes = 0;
  } else next.turn = nextActive(next, player);
  return { position: next };
}
var signedPoints = (result, team) => result.winner === team ? result.points : -result.points;
function createSolver({ maxNodes = 5e6, maxMs = 3e4, maxTable = 3e6 } = {}) {
  const table = /* @__PURE__ */ new Map();
  const legalCache = /* @__PURE__ */ new Map();
  let nodes = 0, deadline = Infinity;
  function legal(hand, level, current) {
    const key2 = faceKey(hand) + "|" + level + "|" + shapeKey(current);
    let plays = legalCache.get(key2);
    if (!plays) {
      plays = candidates(hand, level, current);
      plays.sort(
        (a, b) => Number(b?.cards.length === hand.length) - Number(a?.cards.length === hand.length) || (b ? b.cards.length : -1) - (a ? a.cards.length : -1)
      );
      if (legalCache.size > 4e5) legalCache.clear();
      legalCache.set(key2, plays);
    }
    return plays;
  }
  const key = (p) => p.hands.map(faceKey).join("/") + `|${p.L}|${p.turn}|${p.trick ? p.trick.player + ":" + shapeKey(p.trick.play) : "-"}|${p.passes}|${p.out.join("")}`;
  function search2(p, alpha, beta) {
    if (++nodes > maxNodes || (nodes & 1023) === 0 && performance.now() > deadline)
      throw new SolverBudget(nodes);
    const k = key(p);
    const entry = table.get(k);
    if (entry) {
      if (entry.lower === entry.upper) return entry.lower;
      if (entry.lower >= beta) return entry.lower;
      if (entry.upper <= alpha) return entry.upper;
      alpha = Math.max(alpha, entry.lower);
      beta = Math.min(beta, entry.upper);
    }
    const maximizing = p.turn % 2 === 0;
    let best = maximizing ? MIN - 1 : MAX + 1;
    const a0 = alpha, b0 = beta;
    for (const play of legal(p.hands[p.turn], p.L, p.trick?.play || null)) {
      const next = step(p, play);
      const v = next.result ? signedPoints(next.result, 0) : search2(next.position, alpha, beta);
      if (maximizing) {
        if (v > best) best = v;
        if (best > alpha) alpha = best;
      } else {
        if (v < best) best = v;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }
    const stored = entry ? { ...entry } : { lower: MIN, upper: MAX };
    if (best <= a0) stored.upper = Math.min(stored.upper, best);
    else if (best >= b0) stored.lower = Math.max(stored.lower, best);
    else stored.lower = stored.upper = best;
    table.set(k, stored);
    return best;
  }
  function begin() {
    nodes = 0;
    deadline = performance.now() + maxMs;
    if (table.size > maxTable) table.clear();
  }
  const child = (position, play, alpha, beta) => {
    const next = step(position, play);
    return next.result ? signedPoints(next.result, 0) : search2(next.position, alpha, beta);
  };
  return {
    /** Exact value of the position for team 0. */
    value(position) {
      begin();
      return search2(position, MIN, MAX);
    },
    /** Exact value for team 0 after the mover plays `play` (null = pass). */
    actionValue(position, play) {
      begin();
      return child(position, play, MIN, MAX);
    },
    /** Whether `play` keeps the position's team-0 value `v` for the mover (null-window test). */
    keepsValue(position, play, v) {
      begin();
      const maximizing = position.turn % 2 === 0;
      const result = child(position, play, v - 0.5, v + 0.5);
      return maximizing ? result >= v : result <= v;
    },
    get nodes() {
      return nodes;
    },
    get tableSize() {
      return table.size;
    }
  };
}

// web/src/ai/hand-value.js
var AIP;
var UNIT_SCORE;
var unitCost;
function initialize() {
  AIP = {
    // hand evaluation: a single, pair or three counts 1 turn, less for big cards; runs, bombs and wild cards
    ucTop: 0.25,
    ucA: 0.5,
    ucQK: 0.75,
    tripPairMax: 14,
    seqUnit: 0.9,
    fourJokers: 1.5,
    smallJoker: 0.3,
    bigJoker: 0.2,
    bombBase: 0.4,
    bombExtra: 0.1,
    wild: 0.9,
    // following: when to beat an opponent's cards
    urgentWin: 7,
    urgentOpp: 5,
    followFree: 0.35,
    followMaybe: 1.2,
    followMaybeProb: 0.3,
    saveJokerCurBelow: 13,
    saveJokerHand: 8,
    saveJokerProb: 0.6,
    topFree: 1,
    // when to bomb
    bombWinLeft: 7,
    bombRest: 2,
    bombOverBomb: 12,
    bombBigVal: 14,
    bombBigProb: 0.25,
    safeBombRest: 3,
    // what counts as a play that wins the lead back; arranging the hand: what each play (not bombs) costs on top of its score
    ctrlSingle: 14,
    ctrlPair: 13,
    ctrlTrip: 12,
    ctrlSeq: 9,
    armHand: 0.3,
    armNodes: 400,
    // early and middle game: how often a play that would win the lead back is kept, or a fit left to your partner
    saveCtrlProb: 0,
    midLeaveProb: 0.2,
    // 牌力 tiers (0-100, the hand as dealt): 1 aims to put both opponents last, 2 to go out first, 3 for second or third,
    // 4 not to end up both last; the weaker tiers leave more to the partner
    tier1: 85,
    tier2: 55,
    tier3: 20,
    leaveWeak: 0.5,
    // no bomb when the partner, still to play, can most likely beat it (the unseen cards dealt at random this many times)
    mateBeatProb: 0.8,
    mateSamples: 40,
    // a small card is 10 or below
    smallMax: 10,
    // an opponent's bomb, bombed back or not by how many bombs you hold (straight flushes and the four jokers count), how
    // many levels your smallest one that beats it is above theirs (one level: the smallest bomb there is that beats it),
    // and how many cards they have left. One bomb: bomb when they hold this many or fewer; not when your partner is yet to
    // play and yours is this many levels above or more. Two bombs: bomb when yours is within this many levels; not when it
    // is further above and they hold this many or more. Three or more: always, with the smallest that beats it
    bbOneLeft: 7,
    bbOneFar: 10,
    bbTwoNear: 6,
    bbTwoFarMin: 18,
    // late game, no bomb that leaves a small single to get rid of while an opponent still holds more than this many cards
    lateBombOppMax: 10,
    // top your partner's small single or pair with an ace or the level card when the next opponent holds this many or fewer
    topMateNextMax: 7,
    // each of those rules on (1) or off (0), to test them one at a time: keep big singles early, the smallest pair with a three,
    // bomb back, no hurry to bomb late, leave the joker to the partner, top the partner's small card, hand the partner a play
    // they may go out on, no three-with-a-pair or straight led to an opponent with five cards
    rKeepBig: 1,
    rSmallPair: 1,
    rBombBack: 1,
    rLateBomb: 1,
    rMateJoker: 1,
    rTopMate: 1,
    rFeed: 1,
    rNoFive: 1
  };
  UNIT_SCORE = {
    single1: {
      2: -0.94,
      3: -0.8,
      4: -0.66,
      5: -0.55,
      6: -0.44,
      7: -0.36,
      8: -0.28,
      9: -0.18,
      10: -0.11,
      11: -0.03,
      12: 0.08,
      13: 0.18,
      14: 0.25,
      15: 0.39,
      16: 0.55,
      17: 0.77
    },
    pair2: {
      2: -0.66,
      3: -0.61,
      4: -0.52,
      5: -0.46,
      6: -0.41,
      7: -0.34,
      8: -0.26,
      9: -0.2,
      10: -0.12,
      11: -0.01,
      12: 0.08,
      13: 0.2,
      14: 0.32,
      15: 0.48,
      16: 0.61,
      17: 0.69
    },
    triple3: {
      2: 0,
      3: -0.05,
      4: 0.1,
      5: 0.1,
      6: 0.08,
      7: 0.13,
      8: 0.18,
      9: 0.2,
      10: 0.29,
      11: 0.32,
      12: 0.27,
      13: 0.37,
      14: 0.32,
      15: 0.18
    },
    full5: {
      2: -0.65,
      3: -0.48,
      4: -0.36,
      5: -0.24,
      6: -0.16,
      7: -0.09,
      8: -0.01,
      9: 0.07,
      10: 0.14,
      11: 0.2,
      12: 0.25,
      13: 0.39,
      14: 0.45,
      15: 0.52
    },
    straight5: {
      1: -0.46,
      2: -0.3,
      3: -0.18,
      4: -0.08,
      5: 0.03,
      6: 0.12,
      7: 0.2,
      8: 0.26,
      9: 0.38,
      10: 0.59
    },
    pairs36: {
      1: -0.16,
      2: -0.07,
      3: -0.05,
      4: 0.01,
      5: -0.01,
      6: 0.05,
      7: 0.08,
      8: 0.08,
      9: 0.15,
      10: 0.18,
      11: 0.25,
      12: 0.28
    },
    trip26: {
      1: 0.26,
      2: 0.32,
      3: 0.34,
      4: 0.29,
      5: 0.3,
      6: 0.29,
      7: 0.32,
      8: 0.25,
      9: 0.25,
      10: 0.22,
      11: 0.23,
      12: 0.18,
      13: 0.13
    },
    bomb4: {
      2: 1.54,
      3: 1.55,
      4: 1.55,
      5: 1.56,
      6: 1.55,
      7: 1.57,
      8: 1.57,
      9: 1.58,
      10: 1.59,
      11: 1.6,
      12: 1.62,
      13: 1.63,
      14: 1.6,
      15: 1.61
    },
    bomb5: {
      2: 1.64,
      3: 1.66,
      4: 1.68,
      5: 1.7,
      6: 1.7,
      7: 1.7,
      8: 1.71,
      9: 1.73,
      10: 1.72,
      11: 1.73,
      12: 1.72,
      13: 1.73,
      14: 1.69,
      15: 1.74
    },
    bomb6: {
      2: 1.91,
      3: 1.91,
      4: 1.91,
      5: 1.92,
      6: 1.93,
      7: 1.93,
      8: 1.95,
      9: 1.95,
      10: 1.96,
      11: 1.98,
      12: 1.98,
      13: 1.99,
      14: 1.97,
      15: 1.97
    },
    bomb7: {
      2: 1.98,
      3: 2,
      4: 2,
      5: 1.96,
      6: 2,
      7: 2,
      8: 2,
      9: 1.94,
      10: 2,
      11: 1.94,
      12: 2,
      13: 2,
      14: 2
    },
    bomb8: { 2: 2, 3: 2, 4: 2, 5: 2, 9: 2, 11: 2 },
    sflush5: {
      1: 1.8,
      2: 1.82,
      3: 1.85,
      4: 1.83,
      5: 1.85,
      6: 1.85,
      7: 1.87,
      8: 1.88,
      9: 1.91,
      10: 1.94
    },
    jokers4: { 99: 2 }
  };
  unitCost = (v) => v >= 15 ? AIP.ucTop : v >= 14 ? AIP.ucA : v >= 12 ? AIP.ucQK : 1;
}

// web/src/analysis/concepts.mjs
if (!AIP) initialize();
var deck = makeDeck();
function unseenPhysicalCards(state) {
  const known = [...state.hand, ...state.log.flatMap((e) => e.cards || [])];
  if (new Set(known).size !== known.length || known.some((id) => !deck[id]))
    throw Error("Duplicate or invalid public cards");
  const seen = new Set(known);
  const unseen = deck.filter((c) => !seen.has(c.id)).map((c) => c.id);
  if (unseen.length !== state.counts.reduce((n, c, p) => n + (p === state.p ? 0 : c), 0))
    throw Error("Public counts do not conserve 108 physical cards");
  return unseen;
}

// web/src/ai/encoding.mjs
function cardIndex(id) {
  const n = id % 54;
  return n >= 52 ? n : n % 13 * 4 + [1, 0, 2, 3][Math.floor(n / 13)];
}
function cardsArray(ids) {
  const a = new Float32Array(54);
  if (ids?.length === 1 && ids[0] === -1) return a.fill(-1);
  for (const id of ids || []) a[cardIndex(id)]++;
  return a;
}
function universalFlags(hand, level) {
  const result = new Float32Array(12), wild = (level - 2) * 4;
  if (!hand[wild]) return result;
  result[0] = 1;
  for (let suit = 0; suit < 4 && !result[1]; suit++)
    for (let start = 0; start < 8; start++) {
      let missing = 0;
      for (let rank = start; rank < start + 5; rank++)
        if (suit + rank * 4 === wild || !hand[suit + rank * 4]) missing++;
      if (missing <= 1) {
        result[1] = 1;
        break;
      }
    }
  const counts = Array.from(
    { length: 13 },
    (_, rank) => [0, 1, 2, 3].filter((suit) => suit + rank * 4 !== wild && hand[suit + rank * 4]).length
  );
  for (let i = 8 - Math.max(1, Math.min(6, Math.max(...counts))); i < 8; i++) result[i] = 1;
  let tail = 0;
  for (let i = 0; i < 13; i++) {
    const c = counts[i];
    if (!c) {
      tail = 0;
      continue;
    }
    tail++;
    if (i >= 1) {
      const prev = counts[i - 1];
      if (c === 2 && prev >= 3 || c >= 3 && prev === 2) result[9] = 1;
      else if (c === 2 && prev === 2) result[11] = 1;
    }
    if (i >= 2) {
      const a = counts[i - 2], b = counts[i - 1];
      if (a === 1 && b >= 2 && c >= 2 || a >= 2 && b === 1 && c >= 2 || a >= 2 && b >= 2 && c === 1)
        result[10] = 1;
    }
  }
  if (tail >= 4) result[8] = 1;
  return result;
}
function replay(log) {
  const histories = [[], [], [], []], sequence = [], out = [], remaining = [27, 27, 27, 27];
  let flag = 1;
  const append = (p, cards) => {
    histories[p].push(cards);
    sequence.push(cards);
  };
  for (const e of log) {
    const p = e.p, cards = e.cards || [];
    append(p, cards);
    if (out.length === 1) {
      if (cards.length && flag === 1) {
        flag = 2;
        if (p === (out[0] + 3) % 4) append(out[0], [-1]);
      } else if (flag === 1 && (p + 1) % 4 === out[0]) {
        flag = 2;
        append(out[0], [-1]);
        append((p + 2) % 4, []);
      } else if (p === (out[0] + 3) % 4 && flag === 2) append(out[0], [-1]);
    } else if (out.length === 2) {
      if (cards.length && flag <= 2) {
        flag = 3;
        if (out.includes((p + 1) % 4)) {
          append((p + 1) % 4, [-1]);
          append((p + 2) % 4, [-1]);
        }
      } else if (flag <= 2 && out.includes((p + 1) % 4)) {
        flag = 3;
        append((p + 1) % 4, [-1]);
        append((p + 2) % 4, [-1]);
        if (p === (out.at(-1) + 2) % 4) append((p + 3) % 4, []);
      } else if (out.includes((p + 1) % 4) && flag === 3) {
        append((p + 1) % 4, [-1]);
        append((p + 2) % 4, [-1]);
      }
    }
    remaining[p] -= cards.length;
    if (remaining[p] === 0 && !out.includes(p)) out.push(p);
  }
  return { histories, sequence, out };
}
function encode(state) {
  const { p, log } = state, hand = cardsArray(state.hand), unseen = new Float32Array(54).fill(2);
  for (let i = 0; i < 54; i++) unseen[i] -= hand[i];
  for (const e of log) for (const id of e.cards || []) unseen[cardIndex(id)]--;
  const { histories, sequence, out } = replay(log), mate = (p + 2) % 4;
  const lastMate = histories[mate].length && !out.includes(mate) ? histories[mate].at(-1) : [-1];
  const parts = [
    hand,
    universalFlags(hand, state.level),
    unseen,
    cardsArray(sequence.length ? sequence.at(-1) : [-1]),
    cardsArray(lastMate)
  ];
  for (const offset of [1, 2, 3])
    parts.push(
      cardsArray(log.filter((e) => e.p === (p + offset) % 4).flatMap((e) => e.cards || []))
    );
  for (const offset of [1, 2, 3]) {
    const one = new Float32Array(28);
    one[state.counts[(p + offset) % 4]] = 1;
    parts.push(one);
  }
  for (const name of ["selfLevel", "opponentLevel", "level"]) {
    const one = new Float32Array(13);
    one[state[name] - 2] = 1;
    parts.push(one);
  }
  const result = new Float32Array(513);
  let at = 0;
  for (const part of parts) {
    result.set(part, at);
    at += part.length;
  }
  if (at !== 513) throw new Error("Invalid model feature size");
  return result;
}

// web/src/ai/search/known-cards.mjs
var BIG_JOKER_FACE = 53;
var KnownCardsError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "KnownCardsError";
  }
};
var isId = (id) => Number.isInteger(id) && id >= 0 && id < 108;
var isSeat = (seat) => Number.isInteger(seat) && seat >= 0 && seat < 4;
function publicKnownCards(view, exchanges) {
  const trib = exchanges?.trib || [];
  const has = exchanges?.kang?.has || [];
  if (!trib.length && !has.length) return [];
  const need = [0, 1, 2, 3].map(() => /* @__PURE__ */ new Map());
  const add = (seat, face, n = 1) => need[seat].set(face, (need[seat].get(face) || 0) + n);
  const take = (seat, face) => {
    const left = need[seat].get(face) || 0;
    if (left > 0) need[seat].set(face, left - 1);
  };
  for (const { g, n } of has) {
    if (!isSeat(g) || !Number.isInteger(n) || n < 0 || n > 2)
      throw new KnownCardsError("Invalid anti-tribute record");
    add(g, BIG_JOKER_FACE, n);
  }
  for (const t of trib) {
    if (!isSeat(t.g) || !isSeat(t.r) || !isId(t.tc))
      throw new KnownCardsError("Invalid tribute record");
    take(t.g, cardIndex(t.tc));
    add(t.r, cardIndex(t.tc));
  }
  for (const t of trib) {
    if (t.rc === void 0 || t.rc === null) continue;
    if (!isId(t.rc)) throw new KnownCardsError("Invalid return record");
    take(t.r, cardIndex(t.rc));
    add(t.g, cardIndex(t.rc));
  }
  for (const entry of view.log)
    for (const id of entry.cards || []) if (isSeat(entry.p)) take(entry.p, cardIndex(id));
  const free = /* @__PURE__ */ new Map();
  for (const id of unseenPhysicalCards(view).sort((a, b) => a - b)) {
    const face = cardIndex(id);
    if (!free.has(face)) free.set(face, []);
    free.get(face).push(id);
  }
  const known = [];
  for (let seat = 0; seat < 4; seat++) {
    if (seat === view.p) continue;
    let total = 0;
    for (const [face, n] of [...need[seat]].sort((a, b) => a[0] - b[0])) {
      const pool = free.get(face) || [];
      if (pool.length < n) throw new KnownCardsError("Known card is no longer unseen");
      for (const card of pool.splice(0, n)) known.push({ seat, card });
      total += n;
    }
    if (total > view.counts[seat]) throw new KnownCardsError("More known cards than hand count");
  }
  return known;
}

// web/src/ai/search/payload.mjs
var deck2 = makeDeck();
var shapeOf = ({ type, value, n }) => ({ type, value, n });
var hidden = Object.freeze({
  get id() {
    throw Error("Hidden card read during search");
  }
});
function restoreGame(payload) {
  const { p, hand, counts } = payload;
  if (!Number.isInteger(p) || p < 0 || p > 3 || payload.turn !== p || counts?.length !== 4 || hand.length !== counts[p] || new Set(hand).size !== hand.length || hand.some((id) => !deck2[id]))
    throw Error("Invalid search payload");
  const log = payload.log.map(
    (e) => e.cards ? {
      p: e.p,
      cards: e.cards.map((id) => deck2[id]),
      type: e.type,
      value: e.value,
      n: e.n,
      lead: e.lead
    } : { p: e.p, cards: null }
  );
  const game = {
    hands: counts.map(
      (n, seat) => seat === p ? hand.map((id) => deck2[id]) : Array(n).fill(hidden)
    ),
    L: payload.L,
    levels: payload.levels.slice(),
    log,
    trick: payload.trick ? {
      player: payload.trick.player,
      play: {
        ...shapeOf(payload.trick),
        ...payload.trick.wu ? { wu: payload.trick.wu } : {},
        cards: payload.trick.cards.map((id) => deck2[id])
      }
    } : null,
    passes: payload.passes,
    out: payload.out.slice(),
    turn: payload.turn
  };
  game.publicKnownCards = publicKnownCards(
    { p, hand, counts, log: payload.log },
    payload.exchanges
  );
  return game;
}

// web/src/ai/observation.js
function policyState(game, player, offset, plays) {
  return {
    p: player,
    hand: game.hands[player].map((card) => card.id),
    counts: game.hands.map((hand) => hand.length),
    log: game.log.map((entry) => ({
      p: entry.p,
      cards: entry.cards?.map((card) => card.id) || null
    })),
    level: game.L,
    selfLevel: game.levels[(player + offset) % 2],
    opponentLevel: game.levels[(player + offset + 1) % 2],
    canPass: !!game.trick,
    actions: plays.map((play) => play?.cards.map((card) => card.id) || [])
  };
}

// web/src/ai/profiles.js
var BOT_PROFILES = Object.freeze([
  {
    id: "balanced",
    name: "均衡",
    summary: "综合判断",
    description: "综合判断局势，按学习到的策略出牌"
  },
  {
    id: "aggressive",
    name: "激进",
    summary: "主动争先",
    description: "更主动争夺出牌权，倾向加快节奏"
  },
  {
    id: "conservative",
    name: "稳健",
    summary: "留牌控场",
    description: "谨慎使用控制牌，倾向保留炸弹"
  },
  {
    id: "observant",
    name: "观察",
    summary: "读牌应对",
    description: "结合本场近期公开出牌与过牌倾向调整选择"
  },
  {
    id: "adaptive",
    name: "融合",
    summary: "随局而变",
    description: "融合争先、留牌与公开观察，随局势调整偏好"
  }
]);

// web/src/ai/endgame.js
var deck3 = makeDeck();

// ai/shared/simulation/simulation.mjs
function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = seed + 1831565813 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function createRound(seed) {
  const random = seededRandom(seed), deck9 = makeDeck();
  for (let index = deck9.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deck9[index], deck9[other]] = [deck9[other], deck9[index]];
  }
  const hands = Array.from({ length: 4 }, () => []);
  deck9.forEach((card, index) => hands[index % 4].push(card));
  const level = 2 + Math.floor(random() * 13);
  return {
    hands,
    L: level,
    levels: [level, level],
    log: [],
    trick: null,
    passes: 0,
    out: [],
    turn: Math.floor(random() * 4)
  };
}
var active2 = (game, seat) => game.hands[seat].length > 0;
function nextActive2(game, seat) {
  for (let step2 = 1; step2 <= 4; step2++)
    if (active2(game, (seat + step2) % 4)) return (seat + step2) % 4;
  throw Error("No active seat");
}
function advanceRound(game, play) {
  const player = game.turn;
  if (play) {
    if (!beats(play, game.trick?.play) || new Set(play.cards.map((card) => card.id)).size !== play.cards.length || !play.cards.every((card) => game.hands[player].some((held) => held.id === card.id)))
      throw Error("Illegal simulated play");
    game.log.push({
      p: player,
      cards: play.cards,
      type: play.type,
      value: play.value,
      n: play.n,
      lead: !game.trick
    });
    const ids = new Set(play.cards.map((card) => card.id));
    game.hands[player] = game.hands[player].filter((card) => !ids.has(card.id));
    if (!active2(game, player)) game.out.push(player);
    game.trick = { player, play };
    game.passes = 0;
  } else {
    if (!game.trick) throw Error("Cannot pass on lead");
    game.log.push({ p: player, cards: null });
    game.passes++;
  }
  if (!active2(game, 0) && !active2(game, 2) || !active2(game, 1) && !active2(game, 3)) {
    const last = game.out.at(-1);
    for (let step2 = 1; step2 <= 4; step2++)
      if (!game.out.includes((last + step2) % 4)) game.out.push((last + step2) % 4);
    const winner2 = game.out[0] % 2;
    const matePosition = game.out.indexOf((game.out[0] + 2) % 4);
    return { winner: winner2, points: matePosition === 1 ? 3 : matePosition === 2 ? 2 : 1, order: game.out };
  }
  const winner = game.trick.player;
  const others = [0, 1, 2, 3].filter((seat) => seat !== winner && active2(game, seat)).length;
  if (game.passes >= others) {
    game.turn = active2(game, winner) ? winner : active2(game, (winner + 2) % 4) ? (winner + 2) % 4 : nextActive2(game, winner);
    game.trick = null;
    game.passes = 0;
  } else game.turn = nextActive2(game, player);
  return null;
}

// web/src/coach/evaluation.mjs
var COACH_MODEL_ID = model_catalog_default.selection.danMCaiChampions[0];
var COACH_MODEL_NAME = botModelName(COACH_MODEL_ID);
var COACH_SEARCH_BOT_ID = BOT_CHOICES.find((choice) => searchBot(choice.id))?.id ?? null;
var COACH_NAME = botModelName(COACH_SEARCH_BOT_ID ?? COACH_MODEL_ID);
var coachDeck = makeDeck();

// web/src/coach/oracle.mjs
var deck4 = makeDeck();

// ai/shared/search/pimc.mjs
var deck5 = makeDeck();
function searchObservation(game, p = game.turn) {
  const plays = candidates(game.hands[p], game.L, game.trick?.play);
  const state = policyState(game, p, 0, plays);
  return {
    ...state,
    player: p,
    levels: game.levels.slice(),
    passes: game.passes,
    out: game.out.slice(),
    log: game.log.map((e) => ({ ...e, cards: e.cards?.map((c) => c.id) || null })),
    trick: game.trick && {
      player: game.trick.player,
      play: {
        type: game.trick.play.type,
        value: game.trick.play.value,
        n: game.trick.play.n,
        wu: game.trick.play.wu || 0
      }
    },
    actionShapes: plays.map((a) => a && { type: a.type, value: a.value, n: a.n, wu: a.wu || 0 }),
    publicKnownCards: structuredClone(game.publicKnownCards || [])
  };
}

// ai/danMCai/belief/features.mjs
var FACES = 54;
var SEATS = 3;
var TARGETS = FACES * SEATS;
var TYPES = [
  "single",
  "pair",
  "triple",
  "full",
  "straight",
  "pairs3",
  "trip2",
  "bomb",
  "sflush",
  "jokers"
];
var RANGES = {
  single: [2, 17],
  pair: [2, 17],
  triple: [2, 15],
  full: [2, 15],
  straight: [1, 10],
  pairs3: [1, 12],
  trip2: [1, 13],
  sflush: [1, 10]
};
var BOMB_SIZES = 3;
var BUCKET_OFFSET = {};
var buckets = 0;
for (const type of TYPES) {
  BUCKET_OFFSET[type] = buckets;
  if (type === "bomb") buckets += BOMB_SIZES * 14;
  else if (type === "jokers") buckets += 1;
  else buckets += RANGES[type][1] - RANGES[type][0] + 1;
}
var SHAPE_BUCKETS = buckets;
function shapeBucket({ type, value, n }) {
  const base = BUCKET_OFFSET[type];
  if (base === void 0) throw Error(`Unknown play type ${type}`);
  if (type === "jokers") return base;
  if (type === "bomb") {
    if (!(n >= 4 && n <= 10) || !(value >= 2 && value <= 15)) throw Error("Bomb outside buckets");
    return base + (Math.min(n, 6) - 4) * 14 + (value - 2);
  }
  const [lo, hi] = RANGES[type];
  if (!Number.isInteger(value) || value < lo || value > hi)
    throw Error(`Shape value outside buckets: ${type} ${value}`);
  return base + value - lo;
}
var blocks = [
  ["own", FACES],
  ["unseen", FACES],
  ["played", SEATS * FACES],
  ["counts", 4],
  ["out", SEATS],
  ["level", 13],
  ["shapes", SEATS * SHAPE_BUCKETS],
  ["passOpponent", SEATS * SHAPE_BUCKETS],
  ["passPartner", SEATS * TYPES.length],
  ["leads", SEATS * TYPES.length]
];
var LAYOUT = {};
var width = 0;
for (const [name, size] of blocks) {
  LAYOUT[name] = [width, width + size];
  width += size;
}
var FEATURES = width;
var isCards = (cards) => Array.isArray(cards) && cards.length > 0;
function publicView(game, seat) {
  return {
    p: seat,
    hand: game.hands[seat].map((card) => card.id),
    counts: game.hands.map((hand) => hand.length),
    level: game.L,
    log: game.log.map((e) => ({
      p: e.p,
      cards: e.cards?.length ? e.cards.map((card) => card.id) : null,
      ...e.cards?.length ? { type: e.type, value: e.value, n: e.n } : {}
    }))
  };
}
function playShape(entry, previous, level, deck9) {
  if (entry.type) return { type: entry.type, value: entry.value, n: entry.n ?? entry.cards.length };
  if (!deck9) throw Error("Public play without shape and no deck to infer it");
  const valid = analyze(
    entry.cards.map((id) => deck9[id]),
    level
  ).filter((s) => beats(s, previous));
  if (valid.length !== 1) throw Error("Missing or ambiguous public shape; refusing to guess");
  return valid[0];
}
function features(view, { deck: deck9 = null } = {}) {
  if (!view || "hands" in view) throw Error("Belief features accept only a public view");
  const { p, hand, counts, level, log } = view;
  if (!Number.isInteger(p) || p < 0 || p > 3) throw Error("Invalid mover");
  if (hand.length !== counts[p]) throw Error("Own count does not match own hand");
  if (!(level >= 2 && level <= 14)) throw Error("Invalid level");
  const x = new Uint8Array(FEATURES);
  const rel = (seat) => (seat - p + 4) % 4;
  const own = LAYOUT.own[0], unseen = LAYOUT.unseen[0], played = LAYOUT.played[0];
  const seen = new Int16Array(FACES);
  for (const id of hand) {
    x[own + cardIndex(id)]++;
    seen[cardIndex(id)]++;
  }
  const left = counts.slice();
  for (const entry of log) if (isCards(entry.cards)) left[entry.p] += entry.cards.length;
  let open = null, owner = -1, passes = 0;
  for (const entry of log) {
    const r = rel(entry.p);
    if (isCards(entry.cards)) {
      const shape = playShape(entry, open, level, deck9);
      for (const id of entry.cards) {
        seen[cardIndex(id)]++;
        if (r) x[played + (r - 1) * FACES + cardIndex(id)]++;
      }
      if (r) {
        x[LAYOUT.shapes[0] + (r - 1) * SHAPE_BUCKETS + shapeBucket(shape)]++;
        if (!open) x[LAYOUT.leads[0] + (r - 1) * TYPES.length + TYPES.indexOf(shape.type)]++;
      }
      left[entry.p] -= entry.cards.length;
      open = shape;
      owner = entry.p;
      passes = 0;
    } else {
      if (!open) throw Error("Public pass without an open trick");
      if (r) {
        if ((owner - entry.p + 4) % 2)
          x[LAYOUT.passOpponent[0] + (r - 1) * SHAPE_BUCKETS + shapeBucket(open)]++;
        else x[LAYOUT.passPartner[0] + (r - 1) * TYPES.length + TYPES.indexOf(open.type)]++;
      }
      passes++;
    }
    const others = [0, 1, 2, 3].filter((s) => s !== owner && left[s] > 0).length;
    if (passes >= others) {
      open = null;
      passes = 0;
    }
  }
  let hidden2 = 0;
  for (let f = 0; f < FACES; f++) {
    if (seen[f] > 2) throw Error("More than two copies of a face seen");
    x[unseen + f] = 2 - seen[f];
    hidden2 += 2 - seen[f];
  }
  if (hidden2 !== counts.reduce((n, c, s) => n + (s === p ? 0 : c), 0))
    throw Error("Public counts do not conserve 108 physical cards");
  for (let r = 0; r < 4; r++) x[LAYOUT.counts[0] + r] = counts[(p + r) % 4];
  for (let r = 1; r < 4; r++) x[LAYOUT.out[0] + r - 1] = counts[(p + r) % 4] === 0 ? 1 : 0;
  x[LAYOUT.level[0] + level - 2] = 1;
  return x;
}
var HISTORY = 12;
var ACTION_FIELDS = 35;
var DENIAL_KINDS = ["single", "pair", "triple"];
var V1_FEATURES = FEATURES;
var LAYOUT_V3 = { ...LAYOUT };
LAYOUT_V3.history = [V1_FEATURES, V1_FEATURES + SEATS * HISTORY * ACTION_FIELDS];
LAYOUT_V3.denial = [
  LAYOUT_V3.history[1],
  LAYOUT_V3.history[1] + DENIAL_KINDS.length * SEATS * FACES
];
var FEATURES_V3 = LAYOUT_V3.denial[1];
var V1_FACE_BLOCKS = [
  LAYOUT.own[0],
  LAYOUT.unseen[0],
  ...[0, 1, 2].map((r) => LAYOUT.played[0] + r * FACES)
];
var FEATURE_SPECS = {
  v1: {
    version: "belief-v1",
    features: FEATURES,
    layout: LAYOUT,
    faceBlocks: V1_FACE_BLOCKS
  },
  v3: {
    version: "belief-v3",
    features: FEATURES_V3,
    layout: LAYOUT_V3,
    faceBlocks: [
      ...V1_FACE_BLOCKS,
      ...Array.from(
        { length: DENIAL_KINDS.length * SEATS },
        (_, k) => LAYOUT_V3.denial[0] + k * FACES
      )
    ]
  }
};
function featureSpec(version = "v1") {
  const key = String(version ?? "v1").replace(/^belief-/, "").replace(/^(\d)$/, "v$1");
  const spec = FEATURE_SPECS[key];
  if (!spec) throw Error(`Unknown belief feature version ${version}`);
  return spec;
}
function faceValue(f, level) {
  if (f === 52) return 16;
  if (f === 53) return 17;
  const rank = Math.floor(f / 4) + 2;
  return rank === level ? 15 : rank;
}
function publicActions(view, { deck: deck9 = null } = {}) {
  const { p, counts, level, log } = view;
  const rel = (seat) => (seat - p + 4) % 4;
  const left = counts.slice();
  for (const entry of log) if (isCards(entry.cards)) left[entry.p] += entry.cards.length;
  const out = [];
  let open = null, openCards = 0, owner = -1, passes = 0;
  for (const entry of log) {
    const record = { seat: entry.p, r: rel(entry.p), owner, open };
    if (isCards(entry.cards)) {
      const shape = playShape(entry, open, level, deck9);
      left[entry.p] -= entry.cards.length;
      Object.assign(record, { pass: false, shape, n: entry.cards.length, lead: !open });
      open = shape;
      openCards = entry.cards.length;
      owner = entry.p;
      passes = 0;
    } else {
      if (!open) throw Error("Public pass without an open trick");
      Object.assign(record, { pass: true, shape: open, n: openCards, lead: false });
      passes++;
    }
    record.left = left[entry.p];
    out.push(record);
    const others = [0, 1, 2, 3].filter((s) => s !== owner && left[s] > 0).length;
    if (passes >= others) {
      open = null;
      passes = 0;
    }
  }
  return out;
}
var cap = (v) => Math.min(255, v);
function featuresV3(view, options) {
  const x = new Uint8Array(FEATURES_V3);
  x.set(features(view, options), 0);
  const actions = publicActions(view, options);
  const H = LAYOUT_V3.history[0], D = LAYOUT_V3.denial[0];
  const filled = [0, 0, 0];
  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i];
    if (!a.r || filled[a.r - 1] >= HISTORY) continue;
    const o = H + ((a.r - 1) * HISTORY + filled[a.r - 1]++) * ACTION_FIELDS;
    x[o] = 1;
    x[o + 1] = a.pass ? 1 : 0;
    x[o + 2 + TYPES.indexOf(a.shape.type)] = 1;
    if (a.shape.type !== "jokers" && a.shape.value >= 1 && a.shape.value <= 17)
      x[o + 12 + a.shape.value - 1] = 1;
    x[o + 29] = cap(a.n);
    x[o + 30] = a.lead ? 1 : 0;
    if (!a.lead && a.owner >= 0) x[o + ((a.owner - a.seat + 4) % 2 ? 32 : 31)] = 1;
    x[o + 33] = a.left;
    x[o + 34] = cap(actions.length - 1 - i);
  }
  for (const a of actions) {
    if (!a.r || !a.pass || !((a.owner - a.seat + 4) % 2)) continue;
    const k = DENIAL_KINDS.indexOf(a.shape.type);
    if (k < 0) continue;
    const o = D + (k * SEATS + a.r - 1) * FACES;
    for (let f = 0; f < FACES; f++)
      if (faceValue(f, view.level) > a.shape.value && x[o + f] < 255) x[o + f]++;
  }
  return x;
}
function featuresFor(view, { version = "v1", deck: deck9 = null } = {}) {
  const spec = featureSpec(version);
  return spec.version === "belief-v3" ? featuresV3(view, { deck: deck9 }) : features(view, { deck: deck9 });
}

// ai/danMCai/belief/sampler.mjs
var FLOOR = 1e-12;
var deck6 = makeDeck();
function logAdd(a, b) {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  return a > b ? a + Math.log1p(Math.exp(b - a)) : b + Math.log1p(Math.exp(a - b));
}
function partition(view, fixedCards) {
  const pool = unseenPhysicalCards(view), unseen = new Set(pool), fixed = [[], [], [], []], assigned = /* @__PURE__ */ new Set();
  const played = new Set(view.log.flatMap((e) => e.cards || []));
  for (const { seat, card } of fixedCards) {
    if (!Number.isInteger(seat) || seat < 0 || seat > 3 || !Number.isInteger(card) || card < 0 || card > 107 || assigned.has(card))
      throw Error("Invalid public fixed card");
    assigned.add(card);
    if (played.has(card)) continue;
    if (seat === view.p) {
      if (!view.hand.includes(card)) throw Error("Contradictory known own card");
    } else {
      if (!unseen.has(card) || fixed[seat].length >= view.counts[seat])
        throw Error("Contradictory public card ownership");
      fixed[seat].push(card);
    }
  }
  const cards = pool.filter((id) => !assigned.has(id));
  const caps = [1, 2, 3].map((r) => view.counts[(view.p + r) % 4] - fixed[(view.p + r) % 4].length);
  if (caps.some((c) => c < 0) || caps.reduce((a, b) => a + b, 0) !== cards.length)
    throw Error("Belief count mismatch");
  return { cards, caps, fixed };
}
function logWeights(cards, caps, probs) {
  if (probs.length !== TARGETS) throw Error("Belief probabilities must have 162 entries");
  return cards.map((id) => {
    const f = cardIndex(id), w = [0, 1, 2].map((r) => {
      const v = Number(probs[f * SEATS + r]);
      if (!(v >= 0) || !Number.isFinite(v)) throw Error("Invalid belief probability");
      return caps[r] > 0 ? Math.max(v, FLOOR) : 0;
    });
    const total = w[0] + w[1] + w[2];
    return w.map((v) => v > 0 ? Math.log(v / total) : -Infinity);
  });
}
function partitionTable(lw, caps) {
  const n = lw.length, A = caps[0] + 1, B = caps[1] + 1;
  const z = new Float64Array((n + 1) * A * B).fill(-Infinity);
  const at = (k, a, b) => (k * A + a) * B + b;
  z[at(n, 0, 0)] = 0;
  for (let k = n - 1; k >= 0; k--) {
    const left = n - k;
    for (let a = 0; a < A && a <= left; a++)
      for (let b = 0; b < B && a + b <= left; b++) {
        const c = left - a - b;
        if (c > caps[2]) continue;
        let v = -Infinity;
        if (a > 0) v = logAdd(v, lw[k][0] + z[at(k + 1, a - 1, b)]);
        if (b > 0) v = logAdd(v, lw[k][1] + z[at(k + 1, a, b - 1)]);
        if (c > 0) v = logAdd(v, lw[k][2] + z[at(k + 1, a, b)]);
        z[at(k, a, b)] = v;
      }
  }
  if (!(z[at(0, caps[0], caps[1])] > -Infinity)) throw Error("No world matches the hand counts");
  return { z, at };
}
function sampleBeliefWorlds(view, probs, { count = 8, seed, fixedCards = view.publicKnownCards || [] } = {}) {
  if ("hands" in view || !Number.isInteger(seed) || !Number.isInteger(count) || count < 1 || count > 1024)
    throw Error("Invalid public belief request");
  if (view.hand.length !== view.counts[view.p]) throw Error("Wrong own count");
  const { cards, caps, fixed } = partition(view, fixedCards);
  const lw = logWeights(cards, caps, probs);
  const { z, at } = partitionTable(lw, caps);
  const random = seededRandom(seed), worlds = [];
  for (let w = 0; w < count; w++) {
    const hands = fixed.map((h) => h.slice());
    hands[view.p] = view.hand.slice();
    let a = caps[0], b = caps[1];
    for (let k = 0; k < cards.length; k++) {
      const c = cards.length - k - a - b;
      const options = [
        a > 0 ? lw[k][0] + z[at(k + 1, a - 1, b)] : -Infinity,
        b > 0 ? lw[k][1] + z[at(k + 1, a, b - 1)] : -Infinity,
        c > 0 ? lw[k][2] + z[at(k + 1, a, b)] : -Infinity
      ];
      const max = Math.max(...options);
      const weights = options.map((v) => v === -Infinity ? 0 : Math.exp(v - max));
      let u = random() * (weights[0] + weights[1] + weights[2]), r = 0;
      while (r < 2 && (u -= weights[r]) > 0) r++;
      if (weights[r] === 0) r = weights.findIndex((v) => v > 0);
      if (r === 0) a--;
      else if (r === 1) b--;
      hands[(view.p + r + 1) % 4].push(cards[k]);
    }
    if (hands.some((h, p) => h.length !== view.counts[p])) throw Error("Belief count mismatch");
    worlds.push(hands);
  }
  return worlds;
}

// web/src/ai/search/core.mjs
var deck7 = makeDeck();
var SearchBudgetError = class extends Error {
  constructor(stage) {
    super(`Search budget exceeded (${stage})`);
    this.name = "SearchBudgetError";
    this.stage = stage;
  }
};
function argmax(values) {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  return best;
}
var remainingCards = (game) => game.hands.reduce((sum, hand) => sum + hand.length, 0);
function netChoice({ roots, championIndex, means, outcome, base, net }) {
  const c = roots.indexOf(championIndex);
  if (c < 0) throw Error("Champion move must be among the searched roots");
  const allowed = roots.map((_, r) => {
    if (r === c || !(net > 0)) return true;
    let wins = 0;
    for (const o of outcome) wins += Math.sign(o[r] - o[c]);
    return wins >= net && means[r] > means[c] + 1e-9;
  });
  const top = Math.max(...means.filter((_, r) => allowed[r]));
  const tied = roots.filter((_, r) => allowed[r] && means[r] >= top - 1e-9);
  const index = tied.reduce((best, i) => base[i] > base[best] ? i : best, tied[0]);
  return { index, tied, allowed, gain: top - means[c] };
}
function searchRootsOf(base, plays, k) {
  const order = Array.from(base, (_, i) => i).sort((a, b) => base[b] - base[a] || a - b);
  const roots = order.slice(0, k);
  const passIndex = plays.findIndex((p) => p === null);
  if (passIndex >= 0 && !roots.includes(passIndex)) roots.push(passIndex);
  return roots;
}
function worldGame(game, hands) {
  return {
    hands: hands.map((hand) => hand.map((id) => deck7[id])),
    L: game.L,
    levels: game.levels.slice(),
    log: game.log.slice(),
    trick: game.trick ? { player: game.trick.player, play: game.trick.play } : null,
    passes: game.passes,
    out: game.out.slice(),
    turn: game.turn
  };
}
function guarded(ctx, stage) {
  const check = () => {
    if (ctx.deadline !== void 0 && ctx.now() > ctx.deadline) throw new SearchBudgetError(stage);
  };
  return {
    check,
    async values(state) {
      check();
      ctx.counter.inferences++;
      return ctx.values(state);
    },
    async probabilities(view) {
      check();
      return ctx.probabilities(view);
    }
  };
}
async function greedy(game, offset, guard) {
  const player = game.turn;
  const plays = candidates(game.hands[player], game.L, game.trick?.play);
  let index = plays.findIndex((play) => play && play.cards.length === game.hands[player].length);
  if (index < 0 && plays.length === 1) index = 0;
  if (index < 0) index = argmax(await guard.values(policyState(game, player, offset, plays)));
  return plays[index];
}
async function rollout(world, play, moverTeam, offset, guard) {
  let result = advanceRound(world, play);
  for (let ply = 0; !result && ply < 1e3; ply++)
    result = advanceRound(world, await greedy(world, offset, guard));
  if (!result) throw Error("Rollout did not terminate");
  return result.winner === moverTeam ? result.points : -result.points;
}
async function beliefWorlds(game, seed, count, guard) {
  const player = game.turn;
  const observation = searchObservation(game, player);
  const probs = await guard.probabilities(publicView(game, player));
  return sampleBeliefWorlds(observation, probs, {
    count,
    seed: worldSeed(seed, game.log.length)
  });
}
async function midgameDecision(game, seed, ctx, params = SEARCH_BOT_V1) {
  ctx.counter ||= { inferences: 0 };
  const guard = guarded(ctx, "midgame");
  const offset = ctx.offset || 0;
  const player = game.turn;
  const plays = candidates(game.hands[player], game.L, game.trick?.play);
  const base = await guard.values(policyState(game, player, offset, plays));
  const championIndex = argmax(base);
  const roots = searchRootsOf(base, plays, params.k);
  const worlds = await beliefWorlds(game, seed, params.worlds, guard);
  const sums = new Float64Array(roots.length);
  const outcome = worlds.map(() => new Float64Array(roots.length));
  for (let w = 0; w < worlds.length; w++)
    for (let r = 0; r < roots.length; r++) {
      outcome[w][r] = await rollout(
        worldGame(game, worlds[w]),
        plays[roots[r]],
        player % 2,
        offset,
        guard
      );
      sums[r] += outcome[w][r];
    }
  const means = Array.from(sums, (s) => s / worlds.length);
  const choice = netChoice({ roots, championIndex, means, outcome, base, net: params.net });
  return { kind: "midgame", ...choice, plays, base, championIndex, roots, means, outcome, worlds };
}
var forMover = (team0Value, seat) => seat % 2 === 0 ? team0Value : -team0Value;
function pimcLabelFromWorlds(game, plays, worlds, solver, minWorlds, check = () => {
}, {
  timeIsBudget = false,
  maxNodes = SEARCH_BOT_V1.solverMaxNodes,
  remaining = null,
  cappedSolver: cappedSolver2 = null,
  solverMs = NODE_SOLVER_MS
} = {}) {
  const sums = new Float64Array(plays.length);
  let used = 0;
  for (const hands of worlds) {
    const position = {
      hands: hands.map((hand) => hand.map((id) => deck7[id])),
      L: game.L,
      turn: game.turn,
      trick: game.trick ? { player: game.trick.player, play: game.trick.play } : null,
      passes: game.passes,
      out: game.out.slice()
    };
    const values = [];
    let skipped = false;
    for (const play of plays) {
      check();
      const left = remaining ? remaining() : Infinity;
      const capped = !!cappedSolver2 && left < solverMs;
      try {
        const callSolver = capped ? cappedSolver2(Math.max(0, left)) : solver;
        values.push(forMover(callSolver.actionValue(position, play), position.turn));
      } catch (error) {
        if (!(error instanceof SolverBudget)) throw error;
        if (capped || timeIsBudget && !(error.nodes > maxNodes))
          throw new SearchBudgetError("endgame");
        skipped = true;
        break;
      }
    }
    if (skipped) continue;
    values.forEach((v, i) => sums[i] += v);
    used++;
  }
  if (used < minWorlds) return { q: null, used };
  return { q: Array.from(sums, (s) => s / used), used };
}
var solverOptions = (ctx, params = SEARCH_BOT_V1) => ({
  timeIsBudget: !!ctx.solverTimeIsBudget,
  maxNodes: params.solverMaxNodes,
  remaining: ctx.deadline !== void 0 ? () => ctx.deadline - ctx.now() : null,
  cappedSolver: ctx.cappedSolver || null,
  solverMs: ctx.solverMs ?? NODE_SOLVER_MS
});
function pimcPick({ q, used }, base, tolerance = SEARCH_BOT_V1.tieTolerance) {
  if (!q) return { index: null, used, tied: 0 };
  const top = Math.max(...q);
  const tied = [];
  q.forEach((y, i) => Math.abs(y - top) <= tolerance && tied.push(i));
  const index = tied.reduce((best, i) => base[i] > base[best] ? i : best, tied[0]);
  return { index, used, tied: tied.length };
}
async function endgameDecision(game, seed, ctx, params = SEARCH_BOT_V1) {
  ctx.counter ||= { inferences: 0 };
  const guard = guarded(ctx, "endgame");
  const offset = ctx.offset || 0;
  const player = game.turn;
  const plays = candidates(game.hands[player], game.L, game.trick?.play);
  const base = await guard.values(policyState(game, player, offset, plays));
  const championIndex = argmax(base);
  const worlds = await beliefWorlds(game, seed, params.endgameWorlds, guard);
  const choice = pimcPick(
    pimcLabelFromWorlds(
      game,
      plays,
      worlds,
      ctx.solver,
      params.minWorlds,
      guard.check,
      solverOptions(ctx, params)
    ),
    base,
    params.tieTolerance
  );
  return {
    kind: "endgame",
    index: choice.index ?? championIndex,
    minWorldsFallback: choice.index === null,
    used: choice.used,
    tied: choice.tied,
    championIndex,
    plays,
    base,
    worlds
  };
}
async function searchBotDecision(game, seed, ctx, params = SEARCH_BOT_V1) {
  const band = searchBand(remainingCards(game), params);
  if (band === "midgame") return midgameDecision(game, seed, ctx, params);
  if (band === "endgame") return endgameDecision(game, seed, ctx, params);
  return null;
}

// web/src/ai/search/coach.mjs
async function coachSearchValues(game, seed, ctx, params = SEARCH_BOT_V1) {
  const band = searchBand(remainingCards(game), params);
  if (band === "midgame") {
    const decision = await midgameDecision(game, seed, ctx, params);
    const values2 = Array(decision.plays.length).fill(null);
    decision.roots.forEach((root, r) => values2[root] = decision.means[r]);
    return {
      kind: "midgame",
      plays: decision.plays,
      base: decision.base,
      values: values2,
      worlds: decision.worlds.length,
      evaluated: decision.roots.length,
      index: decision.index,
      championIndex: decision.championIndex
    };
  }
  if (band !== "endgame") return null;
  ctx.counter ||= { inferences: 0 };
  const guard = guarded(ctx, "endgame");
  const player = game.turn;
  const plays = candidates(game.hands[player], game.L, game.trick?.play);
  const base = await guard.values(policyState(game, player, ctx.offset || 0, plays));
  const worlds = await beliefWorlds(game, seed, params.endgameWorlds, guard);
  const sums = new Float64Array(plays.length);
  let used = 0;
  for (const world of worlds) {
    await ctx.pause?.();
    const one = pimcLabelFromWorlds(
      game,
      plays,
      [world],
      ctx.solver,
      1,
      guard.check,
      solverOptions(ctx, params)
    );
    if (!one.q) continue;
    one.q.forEach((value, i) => sums[i] += value);
    used++;
  }
  const values = used < params.minWorlds ? null : Array.from(sums, (sum) => sum / used);
  return {
    kind: "endgame",
    plays,
    base,
    values,
    worlds: worlds.length,
    used,
    evaluated: values ? plays.length : 0,
    championIndex: argmax(base)
  };
}

// web/src/ai/search/inference.mjs
var STATE = 513;
var ACTION = 54;
var deck8 = makeDeck();
var release = (output) => {
  for (const tensor of Object.values(output || {})) tensor?.dispose?.();
};
function championValues(ort2, session) {
  return async (state) => {
    const n = state.actions.length;
    if (!n) throw Error("No policy actions");
    const actions = new Float32Array(n * ACTION);
    for (let i = 0; i < n; i++) actions.set(cardsArray(state.actions[i]), i * ACTION);
    const output = await session.run({
      state: new ort2.Tensor("float32", encode(state), [1, STATE]),
      actions: new ort2.Tensor("float32", actions, [n, ACTION])
    });
    try {
      const values = Float32Array.from(output.values.data);
      if (values.length !== n || !values.every(Number.isFinite))
        throw Error("Invalid model values");
      return values;
    } finally {
      release(output);
    }
  };
}
function beliefProbabilities(ort2, session, featureVersion) {
  const spec = featureSpec(featureVersion);
  const width2 = session.inputMetadata?.[0]?.shape?.[1];
  if (typeof width2 === "number" && width2 !== spec.features)
    throw Error(`Belief input width ${width2} does not match ${spec.version}`);
  return async (view) => {
    const x = new Float32Array(spec.features);
    x.set(featuresFor(view, { version: spec.version, deck: deck8 }));
    const output = await session.run({
      features: new ort2.Tensor("float32", x, [1, spec.features])
    });
    try {
      const data = output.probs.data;
      if (data.length !== TARGETS || !data.every(Number.isFinite))
        throw Error("Invalid belief output");
      return Float32Array.from(data);
    } finally {
      release(output);
    }
  };
}

// web/src/ai/search-worker.mjs
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = new URL("./vendor/", import.meta.url).href;
var engine = null;
async function load(id, budget) {
  const bot = searchBot(id);
  if (!bot) throw Error("Unknown search bot");
  const base = botModel(bot.base);
  const open = (file, key) => {
    const url = new URL("../models/" + file, import.meta.url);
    url.searchParams.set("v", define_MODEL_VERSIONS_default[key]);
    return ort.InferenceSession.create(url.href, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all"
    });
  };
  const [champion, belief] = await Promise.all([
    open(base.file, "bot:" + base.id),
    open(bot.belief.file, "belief:" + bot.id)
  ]);
  const values = championValues(ort, champion), probabilities = beliefProbabilities(ort, belief, bot.belief.featureVersion);
  const opening = createRound(1);
  const plays = candidates(opening.hands[opening.turn], opening.L, null);
  await values(policyState(opening, opening.turn, 0, plays));
  await probabilities(publicView(opening, opening.turn));
  return {
    id,
    budget,
    values,
    probabilities,
    solver: createSolver({
      maxNodes: SEARCH_BOT_V1.solverMaxNodes,
      maxMs: budget.solverMs,
      maxTable: budget.solverTable
    })
  };
}
var cappedSolver = (ms) => createSolver({
  maxNodes: SEARCH_BOT_V1.solverMaxNodes,
  maxMs: ms,
  maxTable: engine.budget.solverTable
});
function deadlineOf(started, band, remainingMs) {
  const bandMs = band === "midgame" ? engine.budget.midgameMs : engine.budget.endgameMs;
  return started + Math.min(bandMs, Number.isFinite(remainingMs) ? remainingMs : Infinity);
}
async function search(payload, remainingMs) {
  const started = performance.now();
  let game;
  try {
    game = restoreGame(payload);
  } catch (error) {
    if (error instanceof KnownCardsError) return { fallback: true, reason: "known-cards" };
    throw error;
  }
  const band = searchBand(remainingCards(game));
  if (!band) return { fallback: true, reason: "out-of-band" };
  const counter = { inferences: 0 };
  const ctx = {
    values: engine.values,
    probabilities: engine.probabilities,
    solver: engine.solver,
    solverTimeIsBudget: engine.budget.solverMs < NODE_SOLVER_MS,
    solverMs: engine.budget.solverMs,
    cappedSolver,
    offset: payload.offset,
    now: () => performance.now(),
    deadline: deadlineOf(started, band, remainingMs),
    counter
  };
  let decision;
  try {
    decision = await searchBotDecision(game, payload.seed, ctx);
  } catch (error) {
    if (error instanceof SearchBudgetError)
      return {
        fallback: true,
        reason: "budget",
        kind: band,
        ms: performance.now() - started,
        inferences: counter.inferences
      };
    throw error;
  }
  const play = decision.plays[decision.index];
  return {
    ok: true,
    kind: decision.kind,
    index: decision.index,
    championIndex: decision.championIndex,
    candidates: decision.plays.length,
    ids: play ? play.cards.map((card) => card.id) : [],
    shape: play ? { type: play.type, value: play.value, n: play.n } : null,
    minWorldsFallback: !!decision.minWorldsFallback,
    worldsUsed: decision.used ?? decision.worlds.length,
    inferences: counter.inferences,
    ms: performance.now() - started
  };
}
var channel = typeof MessageChannel === "function" ? new MessageChannel() : null;
var wake = null;
if (channel) channel.port1.onmessage = () => wake?.();
var nextTask = () => new Promise((resolve) => {
  if (!channel) return setTimeout(resolve, 0);
  wake = resolve;
  channel.port2.postMessage(0);
});
async function coach(payload, job) {
  const started = performance.now();
  let game;
  try {
    game = restoreGame(payload);
  } catch (error) {
    if (error instanceof KnownCardsError) return { fallback: true, reason: "known-cards" };
    throw error;
  }
  const band = searchBand(remainingCards(game));
  if (!band) return { fallback: true, reason: "out-of-band" };
  let last = performance.now();
  const pause = async () => {
    if (performance.now() - last < 50) return;
    await nextTask();
    last = performance.now();
  };
  const ctx = {
    values: async (state) => {
      await pause();
      return engine.values(state);
    },
    probabilities: engine.probabilities,
    // Its own solver (fresh table per job, freed afterwards): the table bots' transposition table
    // is never warmed or cleared by coach work, so which near-limit worlds a table search solves
    // does not depend on whether the coach is on. Solved values are exact either way.
    solver: createSolver({
      maxNodes: SEARCH_BOT_V1.solverMaxNodes,
      maxMs: engine.budget.solverMs,
      maxTable: engine.budget.solverTable
    }),
    solverTimeIsBudget: engine.budget.solverMs < NODE_SOLVER_MS,
    solverMs: engine.budget.solverMs,
    cappedSolver,
    offset: payload.offset,
    pause,
    now: () => {
      if (job.cancelled) throw new SearchBudgetError("cancelled");
      return performance.now();
    },
    deadline: deadlineOf(started, band),
    counter: { inferences: 0 }
  };
  let result;
  try {
    result = await coachSearchValues(game, payload.seed, ctx);
  } catch (error) {
    if (error instanceof SearchBudgetError)
      return {
        fallback: true,
        reason: error.stage === "cancelled" ? "cancelled" : "budget",
        kind: band,
        ms: performance.now() - started
      };
    throw error;
  }
  if (!result?.values) return { fallback: true, reason: "min-worlds", kind: band };
  return {
    ok: true,
    kind: result.kind,
    plays: result.plays.map((play) => play ? play.cards.map((card) => card.id) : []),
    base: Array.from(result.base),
    values: result.values,
    worlds: result.worlds,
    used: result.used ?? result.worlds,
    evaluated: result.evaluated,
    ms: performance.now() - started
  };
}
var queue = Promise.resolve();
var running = null;
self.onmessage = ({ data }) => {
  const { id, type } = data;
  if (type === "cancel") {
    if (running && running.id === id) running.cancelled = true;
    return;
  }
  queue = queue.then(async () => {
    const job = { id, cancelled: false };
    running = job;
    try {
      if (type === "init") {
        if (!engine || engine.id !== data.bot) engine = await load(data.bot, data.budget);
        self.postMessage({ id, result: { ready: true } });
        return;
      }
      if (type !== "search" && type !== "coach" || !engine)
        throw Error("Search worker not ready");
      self.postMessage({
        id,
        result: type === "coach" ? await coach(data.payload, job) : await search(data.payload, data.remainingMs)
      });
    } catch (error) {
      if (type === "init") engine = null;
      self.postMessage({ id, error: String(error?.message || error) });
    } finally {
      running = null;
    }
  });
};
