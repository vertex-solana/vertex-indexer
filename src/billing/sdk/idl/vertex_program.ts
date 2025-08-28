/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vertex_program.json`.
 */
export type VertexProgram = {
  address: 'programid';
  metadata: {
    name: 'vertexProgram';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'chargeFee';
      discriminator: [228, 164, 147, 10, 76, 19, 86, 221];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'user';
        },
        {
          name: 'userVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'user';
              },
            ];
          };
        },
        {
          name: 'systemAuthority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  121,
                  115,
                  116,
                  101,
                  109,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: 'commitAndStartBilling';
      discriminator: [163, 132, 239, 63, 203, 169, 123, 186];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'user';
        },
        {
          name: 'userVault';
          writable: true;
        },
        {
          name: 'magicProgram';
          address: 'Magic11111111111111111111111111111111111111';
        },
        {
          name: 'magicContext';
          writable: true;
          address: 'MagicContext1111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'delegateUserVault';
      discriminator: [117, 106, 29, 163, 159, 141, 24, 157];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'user';
        },
        {
          name: 'bufferUserVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 117, 102, 102, 101, 114];
              },
              {
                kind: 'account';
                path: 'userVault';
              },
            ];
            program: {
              kind: 'const';
              value: [
                146,
                239,
                255,
                90,
                228,
                213,
                168,
                243,
                76,
                110,
                244,
                174,
                187,
                9,
                176,
                143,
                246,
                124,
                85,
                85,
                224,
                69,
                50,
                223,
                19,
                249,
                202,
                110,
                162,
                230,
                44,
                162,
              ];
            };
          };
        },
        {
          name: 'delegationRecordUserVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [100, 101, 108, 101, 103, 97, 116, 105, 111, 110];
              },
              {
                kind: 'account';
                path: 'userVault';
              },
            ];
            program: {
              kind: 'account';
              path: 'delegationProgram';
            };
          };
        },
        {
          name: 'delegationMetadataUserVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97,
                ];
              },
              {
                kind: 'account';
                path: 'userVault';
              },
            ];
            program: {
              kind: 'account';
              path: 'delegationProgram';
            };
          };
        },
        {
          name: 'userVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'user';
              },
            ];
          };
        },
        {
          name: 'ownerProgram';
          address: 'AtanB6GFaMXuM8mBUgSJUMwtKEB7ii35LAUwAQwdEsFf';
        },
        {
          name: 'delegationProgram';
          address: 'DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'deposit';
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'userVault';
          writable: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'initIndexer';
      discriminator: [109, 20, 16, 12, 226, 39, 39, 161];
      accounts: [
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'indexer';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [105, 110, 100, 101, 120, 101, 114];
              },
              {
                kind: 'account';
                path: 'owner';
              },
              {
                kind: 'arg';
                path: 'indexerId';
              },
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'indexerId';
          type: 'u64';
        },
        {
          name: 'pricePerGbLamports';
          type: 'u64';
        },
      ];
    },
    {
      name: 'initSystemVault';
      discriminator: [88, 3, 51, 241, 94, 0, 30, 237];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'systemAuthority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  121,
                  115,
                  116,
                  101,
                  109,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'initUserVault';
      discriminator: [144, 193, 26, 93, 68, 219, 32, 180];
      accounts: [
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'userVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'owner';
              },
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'processUndelegation';
      discriminator: [196, 28, 41, 206, 48, 37, 51, 167];
      accounts: [
        {
          name: 'baseAccount';
          writable: true;
        },
        {
          name: 'buffer';
        },
        {
          name: 'payer';
          writable: true;
        },
        {
          name: 'systemProgram';
        },
      ];
      args: [
        {
          name: 'accountSeeds';
          type: {
            vec: 'bytes';
          };
        },
      ];
    },
    {
      name: 'trackUserActivity';
      discriminator: [55, 32, 182, 69, 253, 192, 56, 184];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'user';
        },
        {
          name: 'userVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'user';
              },
            ];
          };
        },
        {
          name: 'indexer';
          optional: true;
        },
      ];
      args: [
        {
          name: 'input';
          type: {
            defined: {
              name: 'trackUserActivityInput';
            };
          };
        },
      ];
    },
    {
      name: 'withdrawFee';
      discriminator: [14, 122, 231, 218, 31, 238, 223, 150];
      accounts: [
        {
          name: 'operator';
          writable: true;
          signer: true;
        },
        {
          name: 'systemAuthority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  121,
                  115,
                  116,
                  101,
                  109,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: 'destination';
          writable: true;
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'withdrawIndexerFee';
      discriminator: [212, 238, 70, 42, 23, 91, 221, 207];
      accounts: [
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'indexer';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [105, 110, 100, 101, 120, 101, 114];
              },
              {
                kind: 'account';
                path: 'owner';
              },
              {
                kind: 'arg';
                path: 'indexerId';
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'indexerId';
          type: 'u64';
        },
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'indexer';
      discriminator: [199, 179, 229, 248, 181, 82, 44, 160];
    },
    {
      name: 'systemAuthority';
      discriminator: [57, 7, 18, 209, 200, 52, 206, 118];
    },
    {
      name: 'userVault';
      discriminator: [23, 76, 96, 159, 210, 10, 5, 22];
    },
  ];
  events: [
    {
      name: 'chargeFeeEvent';
      discriminator: [70, 241, 192, 186, 178, 171, 58, 4];
    },
    {
      name: 'commitAndStartBillingEvent';
      discriminator: [45, 27, 163, 105, 13, 177, 239, 61];
    },
    {
      name: 'delegateUserVaultEvent';
      discriminator: [197, 209, 3, 167, 174, 25, 69, 162];
    },
    {
      name: 'depositToVaultEvent';
      discriminator: [45, 84, 119, 19, 66, 187, 194, 90];
    },
    {
      name: 'initIndexerEvent';
      discriminator: [65, 156, 90, 33, 202, 53, 63, 200];
    },
    {
      name: 'initSystemVaultEvent';
      discriminator: [234, 44, 18, 26, 154, 188, 27, 98];
    },
    {
      name: 'initUserVaultEvent';
      discriminator: [191, 68, 75, 38, 136, 27, 211, 34];
    },
    {
      name: 'startBillingEvent';
      discriminator: [112, 229, 3, 5, 91, 247, 73, 222];
    },
    {
      name: 'trackUserActivityEvent';
      discriminator: [26, 60, 18, 226, 109, 134, 140, 171];
    },
    {
      name: 'withdrawFeeEvent';
      discriminator: [242, 145, 119, 66, 223, 172, 95, 55];
    },
    {
      name: 'withdrawIndexerFeeEvent';
      discriminator: [176, 55, 74, 205, 20, 98, 67, 134];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'invalidAccountData';
      msg: 'Invalid account data';
    },
    {
      code: 6001;
      name: 'wrongUserVault';
      msg: 'Wrong user vault';
    },
    {
      code: 6002;
      name: 'userVaultHadDelegated';
      msg: 'User vault already delegated';
    },
    {
      code: 6003;
      name: 'userVaultMustDelegated';
      msg: 'User vault must be delegated';
    },
    {
      code: 6004;
      name: 'invalidOwnerOfUserVault';
      msg: 'Invalid owner of user vault';
    },
    {
      code: 6005;
      name: 'requireIndexer';
      msg: 'Require indexer';
    },
    {
      code: 6006;
      name: 'invalidIndexer';
      msg: 'Invalid indexer';
    },
    {
      code: 6007;
      name: 'overflow';
      msg: 'overflow';
    },
    {
      code: 6008;
      name: 'readDebtLimit';
      msg: 'Read debt limit';
    },
    {
      code: 6009;
      name: 'userVaultIsInBillingProcess';
      msg: 'User vault is in billing process';
    },
    {
      code: 6010;
      name: 'userVaultNotInBillingProcess';
      msg: 'User vault not in billing process';
    },
    {
      code: 6011;
      name: 'userVaultNotTouchThreshold';
      msg: 'User vault not touch threshold';
    },
    {
      code: 6012;
      name: 'userNotHaveEnoughAmountToDeposit';
      msg: 'User not have enough amount to deposit';
    },
    {
      code: 6013;
      name: 'wrongMintTokenFee';
      msg: 'Wrong mint token fee';
    },
    {
      code: 6014;
      name: 'invalidAmountDeposit';
      msg: 'Invalid amount deposit';
    },
    {
      code: 6015;
      name: 'invalidOperator';
      msg: 'Invalid operator';
    },
    {
      code: 6016;
      name: 'insufficientFundsInUserVaultForChargeFee';
      msg: 'Insufficient funds in user vault for charge fee';
    },
    {
      code: 6017;
      name: 'notEnoughRemainingAccountReadDebt';
      msg: 'Not enough remaining account read debt';
    },
    {
      code: 6018;
      name: 'insufficientFundsInIndexerVault';
      msg: 'Insufficient funds in indexer vault';
    },
    {
      code: 6019;
      name: 'insufficientFundsInSystemVault';
      msg: 'Insufficient funds in system vault';
    },
    {
      code: 6020;
      name: 'invalidIndexerPriceForRead';
      msg: 'Invalid indexer price for read';
    },
  ];
  types: [
    {
      name: 'chargeFeeEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'commitAndStartBillingEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'delegateUserVaultEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'userVault';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'depositToVaultEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'indexer';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'indexerId';
            type: 'u64';
          },
          {
            name: 'pricePerGbLamports';
            type: 'u64';
          },
          {
            name: 'rentLamports';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'initIndexerEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'indexer';
            type: 'pubkey';
          },
          {
            name: 'indexerId';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'initSystemVaultEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'systemAuthority';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'initUserVaultEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'readDebt';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'indexerId';
            type: 'u64';
          },
          {
            name: 'bytesAccumulated';
            type: 'u64';
          },
          {
            name: 'pricePerGbLamports';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'startBillingEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'systemAuthority';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'rentLamports';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'trackUserActivityEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bytes';
            type: 'u64';
          },
          {
            name: 'indexerId';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userVault';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'trackUserActivityInput';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'indexerId';
            type: {
              option: 'u64';
            };
          },
          {
            name: 'bytes';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'userVault';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'storageBytes';
            type: 'u64';
          },
          {
            name: 'storageBytesLastBilled';
            type: 'u64';
          },
          {
            name: 'readDebts';
            type: {
              array: [
                {
                  defined: {
                    name: 'readDebt';
                  };
                },
                5,
              ];
            };
          },
          {
            name: 'billingStatus';
            type: {
              option: 'u8';
            };
          },
          {
            name: 'rentLamports';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'withdrawFeeEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'withdrawIndexerFeeEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'indexer';
            type: 'pubkey';
          },
          {
            name: 'indexerOwner';
            type: 'pubkey';
          },
          {
            name: 'indexerId';
            type: 'u64';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
  ];
};
