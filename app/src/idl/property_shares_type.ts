/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/property_shares.json`.
 */
export type PropertyShares = {
  "address": "Bvq9mwXmV95Mz848zK8FZ11JiKfLjGc7savK5u657H9Z",
  "metadata": {
    "name": "propertyShares",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyShares",
      "discriminator": [
        40,
        239,
        138,
        154,
        8,
        37,
        106,
        108
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "property",
            "vault"
          ]
        },
        {
          "name": "usdcMint",
          "writable": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vaultSharesAta",
          "writable": true
        },
        {
          "name": "vaultUsdcAta",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userUsdcAta",
          "writable": true
        },
        {
          "name": "userSharesAta",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amountShares",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userReward",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  114,
                  101,
                  119,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userSharesAta",
          "writable": true
        },
        {
          "name": "userUsdcAta",
          "writable": true
        },
        {
          "name": "poolUsdcAta",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "usdcMint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeProperty",
      "discriminator": [
        221,
        217,
        65,
        122,
        187,
        119,
        89,
        243
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "property"
          ]
        },
        {
          "name": "property",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "depositYield",
      "discriminator": [
        204,
        126,
        164,
        36,
        57,
        174,
        68,
        139
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "property"
          ]
        },
        {
          "name": "property",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "usdcMint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "authorityUsdcAta",
          "writable": true
        },
        {
          "name": "poolUsdcAta",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initMetadataOnly",
      "discriminator": [
        226,
        231,
        249,
        112,
        130,
        184,
        93,
        157
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "property"
          ]
        },
        {
          "name": "property",
          "writable": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "metadataName",
          "type": "string"
        },
        {
          "name": "metadataSymbol",
          "type": "string"
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "initProperty",
      "discriminator": [
        102,
        82,
        126,
        227,
        81,
        172,
        40,
        133
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "propertyId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "property"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "property"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "property"
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "tokenMetadataProgram"
        },
        {
          "name": "vaultSharesAta",
          "writable": true
        },
        {
          "name": "vaultUsdcAta",
          "writable": true
        },
        {
          "name": "poolUsdcAta",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "propertyId",
          "type": "string"
        },
        {
          "name": "totalShares",
          "type": "u64"
        },
        {
          "name": "metadataName",
          "type": "string"
        },
        {
          "name": "metadataSymbol",
          "type": "string"
        },
        {
          "name": "metadataUri",
          "type": "string"
        },
        {
          "name": "pricePerShare",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateMetadataUri",
      "discriminator": [
        27,
        40,
        178,
        7,
        93,
        135,
        196,
        102
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "property"
          ]
        },
        {
          "name": "property",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newUri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      "name": "property",
      "discriminator": [
        195,
        247,
        69,
        181,
        195,
        47,
        152,
        19
      ]
    },
    {
      "name": "userReward",
      "discriminator": [
        174,
        124,
        198,
        235,
        242,
        192,
        95,
        93
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "propertyIdTooLong",
      "msg": "Property identifier too long"
    },
    {
      "code": 6001,
      "name": "metadataUriTooLong",
      "msg": "Metadata URI too long"
    },
    {
      "code": 6002,
      "name": "metadataNameTooLong",
      "msg": "Metadata name too long"
    },
    {
      "code": 6003,
      "name": "metadataSymbolTooLong",
      "msg": "Metadata symbol too long"
    },
    {
      "code": 6004,
      "name": "zeroTotalShares",
      "msg": "Total shares must be greater than zero"
    },
    {
      "code": 6005,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6006,
      "name": "propertyInactive",
      "msg": "Property is inactive"
    },
    {
      "code": 6007,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "invalidVault",
      "msg": "Vault PDA mismatch"
    },
    {
      "code": 6009,
      "name": "invalidPool",
      "msg": "Pool PDA mismatch"
    },
    {
      "code": 6010,
      "name": "unauthorized",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6011,
      "name": "noRewardsAvailable",
      "msg": "No rewards available to claim"
    },
    {
      "code": 6012,
      "name": "rewardUnderflow",
      "msg": "Reward calculation underflow"
    },
    {
      "code": 6013,
      "name": "rewardAccountMismatch",
      "msg": "User reward PDA does not match caller or pool"
    },
    {
      "code": 6014,
      "name": "invalidMetadata",
      "msg": "Invalid metadata PDA"
    },
    {
      "code": 6015,
      "name": "invalidMetadataProgram",
      "msg": "Invalid token metadata program"
    }
  ],
  "types": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "poolUsdcAta",
            "type": "pubkey"
          },
          {
            "name": "accPerShare",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "property",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "totalShares",
            "type": "u64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "paidPerShare",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "vaultSharesAta",
            "type": "pubkey"
          },
          {
            "name": "vaultUsdcAta",
            "type": "pubkey"
          },
          {
            "name": "pricePerShare",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
