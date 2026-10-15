0x102a2ada8 ldr w8, [x27]
0x102a2adac ldr x8, [x20, x8, lsl #3]
0x102a2adb0 str x27, [x28, #8]
0x102a2adb4 br x8
0x102a2adb8 ldr w8, [x27, #0x10]!
0x102a2adbc ldr x8, [x20, x8, lsl #3]
0x102a2adc0 str x27, [x28, #8]
0x102a2adc4 br x8
0x102a2bba0 ldrb w1, [x27, #4]
0x102a2bba4 ldrb w2, [x27, #5]
0x102a2bba8 ldr x1, [x24, x1, lsl #3]
0x102a2bbac ldr x2, [x24, x2, lsl #3]
0x102a2bbb0 add x27, x27, #0x10
0x102a2bbb4 cmp x1, x2
0x102a2bbb8 b.eq #0x102a2adb8
0x102a2bbbc ldr x3, [x27, #8]
0x102a2bbc0 add x27, x27, x3, lsl #4
0x102a2bbc4 ldr w8, [x27]
0x102a2bbc8 ldr x8, [x20, x8, lsl #3]
0x102a2bbcc str x27, [x28, #8]
0x102a2bbd0 br x8
0x102a2bbd4 ldrb w1, [x27, #4]
0x102a2bbd8 ldrb w2, [x27, #5]
0x102a2bbdc ldr x1, [x24, x1, lsl #3]
0x102a2bbe0 ldr x2, [x24, x2, lsl #3]
0x102a2bbe4 add x27, x27, #0x10
0x102a2bbe8 cmp x1, x2
0x102a2bbec b.ne #0x102a2adb8
0x102a2bbf0 ldr x3, [x27, #8]
0x102a2bbf4 add x27, x27, x3, lsl #4
0x102a2bbf8 ldr w8, [x27]
0x102a2bbfc ldr x8, [x20, x8, lsl #3]
0x102a2bc00 str x27, [x28, #8]
0x102a2bc04 br x8
0x102a2bc08 ldrb w1, [x27, #4]
0x102a2bc0c ldrb w2, [x27, #5]
0x102a2bc10 ldr x1, [x24, x1, lsl #3]
0x102a2bc14 ldr x2, [x24, x2, lsl #3]
0x102a2bc18 add x27, x27, #0x10
0x102a2bc1c cmp x1, x2
0x102a2bc20 b.le #0x102a2adb8
0x102a2bc24 ldr x3, [x27, #8]
0x102a2bc28 add x27, x27, x3, lsl #4
0x102a2bc2c ldr w8, [x27]
0x102a2bc30 ldr x8, [x20, x8, lsl #3]
0x102a2bc34 str x27, [x28, #8]
0x102a2bc38 br x8
0x102a2bc3c ldrb w1, [x27, #4]
0x102a2bc40 ldrb w2, [x27, #5]
0x102a2bc44 ldr x1, [x24, x1, lsl #3]
0x102a2bc48 ldr x2, [x24, x2, lsl #3]
0x102a2bc4c add x27, x27, #0x10
0x102a2bc50 cmp x1, x2
0x102a2bc54 b.gt #0x102a2adb8
0x102a2bc58 ldr x3, [x27, #8]
0x102a2bc5c add x27, x27, x3, lsl #4
0x102a2bc60 ldr w8, [x27]
0x102a2bc64 ldr x8, [x20, x8, lsl #3]
0x102a2bc68 str x27, [x28, #8]
0x102a2bc6c br x8
0x102a2bc70 ldrb w1, [x27, #4]
0x102a2bc74 ldrb w2, [x27, #5]
0x102a2bc78 ldr x1, [x24, x1, lsl #3]
0x102a2bc7c ldr x2, [x24, x2, lsl #3]
0x102a2bc80 add x27, x27, #0x10
0x102a2bc84 cmp x1, x2
0x102a2bc88 b.lt #0x102a2adb8
0x102a2bc8c ldr x3, [x27, #8]
0x102a2bc90 add x27, x27, x3, lsl #4
0x102a2bc94 ldr w8, [x27]
0x102a2bc98 ldr x8, [x20, x8, lsl #3]
0x102a2bc9c str x27, [x28, #8]
0x102a2bca0 br x8
0x102a2bca4 ldrb w1, [x27, #4]
0x102a2bca8 ldrb w2, [x27, #5]
0x102a2bcac ldr x1, [x24, x1, lsl #3]
0x102a2bcb0 ldr x2, [x24, x2, lsl #3]
0x102a2bcb4 add x27, x27, #0x10
0x102a2bcb8 cmp x1, x2
0x102a2bcbc b.ge #0x102a2adb8
0x102a2bcc0 ldr x3, [x27, #8]
0x102a2bcc4 add x27, x27, x3, lsl #4
0x102a2bcc8 ldr w8, [x27]
0x102a2bccc ldr x8, [x20, x8, lsl #3]
0x102a2bcd0 str x27, [x28, #8]
0x102a2bcd4 br x8
0x102a2bcd8 ldrb w1, [x27, #4]
0x102a2bcdc ldrb w2, [x27, #5]
0x102a2bce0 ldr x1, [x24, x1, lsl #3]
0x102a2bce4 ldr x2, [x24, x2, lsl #3]
0x102a2bce8 add x27, x27, #0x10
0x102a2bcec cmp x1, x2
0x102a2bcf0 b.ls #0x102a2adb8
0x102a2bcf4 ldr x3, [x27, #8]
0x102a2bcf8 add x27, x27, x3, lsl #4
0x102a2bcfc ldr w8, [x27]
0x102a2bd00 ldr x8, [x20, x8, lsl #3]
0x102a2bd04 str x27, [x28, #8]
0x102a2bd08 br x8
0x102a2bd0c ldrb w1, [x27, #4]
0x102a2bd10 ldrb w2, [x27, #5]
0x102a2bd14 ldr x1, [x24, x1, lsl #3]
0x102a2bd18 ldr x2, [x24, x2, lsl #3]
0x102a2bd1c add x27, x27, #0x10
0x102a2bd20 cmp x1, x2
0x102a2bd24 b.hi #0x102a2adb8
0x102a2bd28 ldr x3, [x27, #8]
0x102a2bd2c add x27, x27, x3, lsl #4
0x102a2bd30 ldr w8, [x27]
0x102a2bd34 ldr x8, [x20, x8, lsl #3]
0x102a2bd38 str x27, [x28, #8]
0x102a2bd3c br x8
0x102a2bd40 ldrb w1, [x27, #4]
0x102a2bd44 ldrb w2, [x27, #5]
0x102a2bd48 ldr x1, [x24, x1, lsl #3]
0x102a2bd4c ldr x2, [x24, x2, lsl #3]
0x102a2bd50 add x27, x27, #0x10
0x102a2bd54 cmp x1, x2
0x102a2bd58 b.lo #0x102a2adb8
0x102a2bd5c ldr x3, [x27, #8]
0x102a2bd60 add x27, x27, x3, lsl #4
0x102a2bd64 ldr w8, [x27]
0x102a2bd68 ldr x8, [x20, x8, lsl #3]
0x102a2bd6c str x27, [x28, #8]
0x102a2bd70 br x8
0x102a2bd74 ldrb w1, [x27, #4]
0x102a2bd78 ldrb w2, [x27, #5]
0x102a2bd7c ldr x1, [x24, x1, lsl #3]
0x102a2bd80 ldr x2, [x24, x2, lsl #3]
0x102a2bd84 add x27, x27, #0x10
0x102a2bd88 cmp x1, x2
0x102a2bd8c b.hs #0x102a2adb8
0x102a2bd90 ldr x3, [x27, #8]
0x102a2bd94 add x27, x27, x3, lsl #4
0x102a2bd98 ldr w8, [x27]
0x102a2bd9c ldr x8, [x20, x8, lsl #3]
0x102a2bda0 str x27, [x28, #8]
0x102a2bda4 br x8
0x102a2bda8 ldrb w1, [x27, #4]
0x102a2bdac ldrb w2, [x27, #5]
0x102a2bdb0 ldr x1, [x24, x1, lsl #3]
0x102a2bdb4 ldr x2, [x24, x2, lsl #3]
0x102a2bdb8 add x27, x27, #0x10
0x102a2bdbc cmp w1, w2
0x102a2bdc0 b.eq #0x102a2adb8
0x102a2bdc4 ldr x3, [x27, #8]
0x102a2bdc8 add x27, x27, x3, lsl #4
0x102a2bdcc ldr w8, [x27]
0x102a2bdd0 ldr x8, [x20, x8, lsl #3]
0x102a2bdd4 str x27, [x28, #8]
0x102a2bdd8 br x8
0x102a2bddc ldrb w1, [x27, #4]
0x102a2bde0 ldrb w2, [x27, #5]
0x102a2bde4 ldr x1, [x24, x1, lsl #3]
0x102a2bde8 ldr x2, [x24, x2, lsl #3]
0x102a2bdec add x27, x27, #0x10
0x102a2bdf0 cmp w1, w2
0x102a2bdf4 b.ne #0x102a2adb8
0x102a2bdf8 ldr x3, [x27, #8]
0x102a2bdfc add x27, x27, x3, lsl #4
0x102a2be00 ldr w8, [x27]
0x102a2be04 ldr x8, [x20, x8, lsl #3]
0x102a2be08 str x27, [x28, #8]
0x102a2be0c br x8
0x102a2be10 ldrb w1, [x27, #4]
0x102a2be14 ldrb w2, [x27, #5]
0x102a2be18 ldr x1, [x24, x1, lsl #3]
0x102a2be1c ldr x2, [x24, x2, lsl #3]
0x102a2be20 add x27, x27, #0x10
0x102a2be24 cmp w1, w2
0x102a2be28 b.le #0x102a2adb8
0x102a2be2c ldr x3, [x27, #8]
0x102a2be30 add x27, x27, x3, lsl #4
0x102a2be34 ldr w8, [x27]
0x102a2be38 ldr x8, [x20, x8, lsl #3]
0x102a2be3c str x27, [x28, #8]
0x102a2be40 br x8
0x102a2be44 ldrb w1, [x27, #4]
0x102a2be48 ldrb w2, [x27, #5]
0x102a2be4c ldr x1, [x24, x1, lsl #3]
0x102a2be50 ldr x2, [x24, x2, lsl #3]
0x102a2be54 add x27, x27, #0x10
0x102a2be58 cmp w1, w2
0x102a2be5c b.gt #0x102a2adb8
0x102a2be60 ldr x3, [x27, #8]
0x102a2be64 add x27, x27, x3, lsl #4
0x102a2be68 ldr w8, [x27]
0x102a2be6c ldr x8, [x20, x8, lsl #3]
0x102a2be70 str x27, [x28, #8]
0x102a2be74 br x8
0x102a2be78 ldrb w1, [x27, #4]
0x102a2be7c ldrb w2, [x27, #5]
0x102a2be80 ldr x1, [x24, x1, lsl #3]
0x102a2be84 ldr x2, [x24, x2, lsl #3]
0x102a2be88 add x27, x27, #0x10
0x102a2be8c cmp w1, w2
0x102a2be90 b.lt #0x102a2adb8
0x102a2be94 ldr x3, [x27, #8]
0x102a2be98 add x27, x27, x3, lsl #4
0x102a2be9c ldr w8, [x27]
0x102a2bea0 ldr x8, [x20, x8, lsl #3]
0x102a2bea4 str x27, [x28, #8]
0x102a2bea8 br x8
0x102a2beac ldrb w1, [x27, #4]
0x102a2beb0 ldrb w2, [x27, #5]
0x102a2beb4 ldr x1, [x24, x1, lsl #3]
0x102a2beb8 ldr x2, [x24, x2, lsl #3]
0x102a2bebc add x27, x27, #0x10
0x102a2bec0 cmp w1, w2
0x102a2bec4 b.ge #0x102a2adb8
0x102a2bec8 ldr x3, [x27, #8]
0x102a2becc add x27, x27, x3, lsl #4
0x102a2bed0 ldr w8, [x27]
0x102a2bed4 ldr x8, [x20, x8, lsl #3]
0x102a2bed8 str x27, [x28, #8]
0x102a2bedc br x8
0x102a2bee0 ldrb w1, [x27, #4]
0x102a2bee4 ldrb w2, [x27, #5]
0x102a2bee8 ldr x1, [x24, x1, lsl #3]
0x102a2beec ldr x2, [x24, x2, lsl #3]
0x102a2bef0 add x27, x27, #0x10
0x102a2bef4 cmp w1, w2
0x102a2bef8 b.ls #0x102a2adb8
0x102a2befc ldr x3, [x27, #8]
0x102a2bf00 add x27, x27, x3, lsl #4
0x102a2bf04 ldr w8, [x27]
0x102a2bf08 ldr x8, [x20, x8, lsl #3]
0x102a2bf0c str x27, [x28, #8]
0x102a2bf10 br x8
0x102a2bf14 ldrb w1, [x27, #4]
0x102a2bf18 ldrb w2, [x27, #5]
0x102a2bf1c ldr x1, [x24, x1, lsl #3]
0x102a2bf20 ldr x2, [x24, x2, lsl #3]
0x102a2bf24 add x27, x27, #0x10
0x102a2bf28 cmp w1, w2
0x102a2bf2c b.hi #0x102a2adb8
0x102a2bf30 ldr x3, [x27, #8]
0x102a2bf34 add x27, x27, x3, lsl #4
0x102a2bf38 ldr w8, [x27]
0x102a2bf3c ldr x8, [x20, x8, lsl #3]
0x102a2bf40 str x27, [x28, #8]
0x102a2bf44 br x8
0x102a2bf48 ldrb w1, [x27, #4]
0x102a2bf4c ldrb w2, [x27, #5]
0x102a2bf50 ldr x1, [x24, x1, lsl #3]
0x102a2bf54 ldr x2, [x24, x2, lsl #3]
0x102a2bf58 add x27, x27, #0x10
0x102a2bf5c cmp w1, w2
0x102a2bf60 b.lo #0x102a2adb8
0x102a2bf64 ldr x3, [x27, #8]
0x102a2bf68 add x27, x27, x3, lsl #4
0x102a2bf6c ldr w8, [x27]
0x102a2bf70 ldr x8, [x20, x8, lsl #3]
0x102a2bf74 str x27, [x28, #8]
0x102a2bf78 br x8
0x102a2bf7c ldrb w1, [x27, #4]
0x102a2bf80 ldrb w2, [x27, #5]
0x102a2bf84 ldr x1, [x24, x1, lsl #3]
0x102a2bf88 ldr x2, [x24, x2, lsl #3]
0x102a2bf8c add x27, x27, #0x10
0x102a2bf90 cmp w1, w2
0x102a2bf94 b.hs #0x102a2adb8
0x102a2bf98 ldr x3, [x27, #8]
0x102a2bf9c add x27, x27, x3, lsl #4
0x102a2bfa0 ldr w8, [x27]
0x102a2bfa4 ldr x8, [x20, x8, lsl #3]
0x102a2bfa8 str x27, [x28, #8]
0x102a2bfac br x8
0x102a2bfb0 ldrb w0, [x27, #4]
0x102a2bfb4 ldr x1, [x24, x0, lsl #3]
0x102a2bfb8 ldr x2, [x27, #8]
0x102a2bfbc add x27, x27, #0x10
0x102a2bfc0 cmp x1, x2
0x102a2bfc4 b.eq #0x102a2adb8
0x102a2bfc8 ldr x3, [x27, #8]
0x102a2bfcc add x27, x27, x3, lsl #4
0x102a2bfd0 ldr w8, [x27]
0x102a2bfd4 ldr x8, [x20, x8, lsl #3]
0x102a2bfd8 str x27, [x28, #8]
0x102a2bfdc br x8
0x102a2bfe0 ldrb w0, [x27, #4]
0x102a2bfe4 ldr x1, [x24, x0, lsl #3]
0x102a2bfe8 ldr x2, [x27, #8]
0x102a2bfec add x27, x27, #0x10
0x102a2bff0 cmp x1, x2
0x102a2bff4 b.ne #0x102a2adb8
0x102a2bff8 ldr x3, [x27, #8]
0x102a2bffc add x27, x27, x3, lsl #4
0x102a2c000 ldr w8, [x27]
0x102a2c004 ldr x8, [x20, x8, lsl #3]
0x102a2c008 str x27, [x28, #8]
0x102a2c00c br x8
0x102a2c010 ldrb w0, [x27, #4]
0x102a2c014 ldr x1, [x24, x0, lsl #3]
0x102a2c018 ldr x2, [x27, #8]
0x102a2c01c add x27, x27, #0x10
0x102a2c020 cmp x1, x2
0x102a2c024 b.le #0x102a2adb8
0x102a2c028 ldr x3, [x27, #8]
0x102a2c02c add x27, x27, x3, lsl #4
0x102a2c030 ldr w8, [x27]
0x102a2c034 ldr x8, [x20, x8, lsl #3]
0x102a2c038 str x27, [x28, #8]
0x102a2c03c br x8
0x102a2c040 ldrb w0, [x27, #4]
0x102a2c044 ldr x1, [x24, x0, lsl #3]
0x102a2c048 ldr x2, [x27, #8]
0x102a2c04c add x27, x27, #0x10
0x102a2c050 cmp x1, x2
0x102a2c054 b.gt #0x102a2adb8
0x102a2c058 ldr x3, [x27, #8]
0x102a2c05c add x27, x27, x3, lsl #4
0x102a2c060 ldr w8, [x27]
0x102a2c064 ldr x8, [x20, x8, lsl #3]
0x102a2c068 str x27, [x28, #8]
0x102a2c06c br x8
0x102a2c070 ldrb w0, [x27, #4]
0x102a2c074 ldr x1, [x24, x0, lsl #3]
0x102a2c078 ldr x2, [x27, #8]
0x102a2c07c add x27, x27, #0x10
0x102a2c080 cmp x1, x2
0x102a2c084 b.lt #0x102a2adb8
0x102a2c088 ldr x3, [x27, #8]
0x102a2c08c add x27, x27, x3, lsl #4
0x102a2c090 ldr w8, [x27]
0x102a2c094 ldr x8, [x20, x8, lsl #3]
0x102a2c098 str x27, [x28, #8]
0x102a2c09c br x8
0x102a2c0a0 ldrb w0, [x27, #4]
0x102a2c0a4 ldr x1, [x24, x0, lsl #3]
0x102a2c0a8 ldr x2, [x27, #8]
0x102a2c0ac add x27, x27, #0x10
0x102a2c0b0 cmp x1, x2
0x102a2c0b4 b.ge #0x102a2adb8
0x102a2c0b8 ldr x3, [x27, #8]
0x102a2c0bc add x27, x27, x3, lsl #4
0x102a2c0c0 ldr w8, [x27]
0x102a2c0c4 ldr x8, [x20, x8, lsl #3]
0x102a2c0c8 str x27, [x28, #8]
0x102a2c0cc br x8
0x102a2c0d0 ldrb w0, [x27, #4]
0x102a2c0d4 ldr x1, [x24, x0, lsl #3]
0x102a2c0d8 ldr x2, [x27, #8]
0x102a2c0dc add x27, x27, #0x10
0x102a2c0e0 cmp x1, x2
0x102a2c0e4 b.ls #0x102a2adb8
0x102a2c0e8 ldr x3, [x27, #8]
0x102a2c0ec add x27, x27, x3, lsl #4
0x102a2c0f0 ldr w8, [x27]
0x102a2c0f4 ldr x8, [x20, x8, lsl #3]
0x102a2c0f8 str x27, [x28, #8]
0x102a2c0fc br x8
0x102a2c100 ldrb w0, [x27, #4]
0x102a2c104 ldr x1, [x24, x0, lsl #3]
0x102a2c108 ldr x2, [x27, #8]
0x102a2c10c add x27, x27, #0x10
0x102a2c110 cmp x1, x2
0x102a2c114 b.hi #0x102a2adb8
0x102a2c118 ldr x3, [x27, #8]
0x102a2c11c add x27, x27, x3, lsl #4
0x102a2c120 ldr w8, [x27]
0x102a2c124 ldr x8, [x20, x8, lsl #3]
0x102a2c128 str x27, [x28, #8]
0x102a2c12c br x8
0x102a2c130 ldrb w0, [x27, #4]
0x102a2c134 ldr x1, [x24, x0, lsl #3]
0x102a2c138 ldr x2, [x27, #8]
0x102a2c13c add x27, x27, #0x10
0x102a2c140 cmp x1, x2
0x102a2c144 b.lo #0x102a2adb8
0x102a2c148 ldr x3, [x27, #8]
0x102a2c14c add x27, x27, x3, lsl #4
0x102a2c150 ldr w8, [x27]
0x102a2c154 ldr x8, [x20, x8, lsl #3]
0x102a2c158 str x27, [x28, #8]
0x102a2c15c br x8
0x102a2c160 ldrb w0, [x27, #4]
0x102a2c164 ldr x1, [x24, x0, lsl #3]
0x102a2c168 ldr x2, [x27, #8]
0x102a2c16c add x27, x27, #0x10
0x102a2c170 cmp x1, x2
0x102a2c174 b.hs #0x102a2adb8
0x102a2c178 ldr x3, [x27, #8]
0x102a2c17c add x27, x27, x3, lsl #4
0x102a2c180 ldr w8, [x27]
0x102a2c184 ldr x8, [x20, x8, lsl #3]
0x102a2c188 str x27, [x28, #8]
0x102a2c18c br x8
0x102a2c190 ldrb w0, [x27, #4]
0x102a2c194 ldr x1, [x24, x0, lsl #3]
0x102a2c198 ldr x2, [x27, #8]
0x102a2c19c add x27, x27, #0x10
0x102a2c1a0 cmp w1, w2
0x102a2c1a4 b.eq #0x102a2adb8
0x102a2c1a8 ldr x3, [x27, #8]
0x102a2c1ac add x27, x27, x3, lsl #4
0x102a2c1b0 ldr w8, [x27]
0x102a2c1b4 ldr x8, [x20, x8, lsl #3]
0x102a2c1b8 str x27, [x28, #8]
0x102a2c1bc br x8
0x102a2c1c0 ldrb w0, [x27, #4]
0x102a2c1c4 ldr x1, [x24, x0, lsl #3]
0x102a2c1c8 ldr x2, [x27, #8]
0x102a2c1cc add x27, x27, #0x10
0x102a2c1d0 cmp w1, w2
0x102a2c1d4 b.ne #0x102a2adb8
0x102a2c1d8 ldr x3, [x27, #8]
0x102a2c1dc add x27, x27, x3, lsl #4
0x102a2c1e0 ldr w8, [x27]
0x102a2c1e4 ldr x8, [x20, x8, lsl #3]
0x102a2c1e8 str x27, [x28, #8]
0x102a2c1ec br x8
0x102a2c1f0 ldrb w0, [x27, #4]
0x102a2c1f4 ldr x1, [x24, x0, lsl #3]
0x102a2c1f8 ldr x2, [x27, #8]
0x102a2c1fc add x27, x27, #0x10
0x102a2c200 cmp w1, w2
0x102a2c204 b.le #0x102a2adb8
0x102a2c208 ldr x3, [x27, #8]
0x102a2c20c add x27, x27, x3, lsl #4
0x102a2c210 ldr w8, [x27]
0x102a2c214 ldr x8, [x20, x8, lsl #3]
0x102a2c218 str x27, [x28, #8]
0x102a2c21c br x8
0x102a2c220 ldrb w0, [x27, #4]
0x102a2c224 ldr x1, [x24, x0, lsl #3]
0x102a2c228 ldr x2, [x27, #8]
0x102a2c22c add x27, x27, #0x10
0x102a2c230 cmp w1, w2
0x102a2c234 b.gt #0x102a2adb8
0x102a2c238 ldr x3, [x27, #8]
0x102a2c23c add x27, x27, x3, lsl #4
0x102a2c240 ldr w8, [x27]
0x102a2c244 ldr x8, [x20, x8, lsl #3]
0x102a2c248 str x27, [x28, #8]
0x102a2c24c br x8
0x102a2c250 ldrb w0, [x27, #4]
0x102a2c254 ldr x1, [x24, x0, lsl #3]
0x102a2c258 ldr x2, [x27, #8]
0x102a2c25c add x27, x27, #0x10
0x102a2c260 cmp w1, w2
0x102a2c264 b.lt #0x102a2adb8
0x102a2c268 ldr x3, [x27, #8]
0x102a2c26c add x27, x27, x3, lsl #4
0x102a2c270 ldr w8, [x27]
0x102a2c274 ldr x8, [x20, x8, lsl #3]
0x102a2c278 str x27, [x28, #8]
0x102a2c27c br x8
0x102a2c280 ldrb w0, [x27, #4]
0x102a2c284 ldr x1, [x24, x0, lsl #3]
0x102a2c288 ldr x2, [x27, #8]
0x102a2c28c add x27, x27, #0x10
0x102a2c290 cmp w1, w2
0x102a2c294 b.ge #0x102a2adb8
0x102a2c298 ldr x3, [x27, #8]
0x102a2c29c add x27, x27, x3, lsl #4
0x102a2c2a0 ldr w8, [x27]
0x102a2c2a4 ldr x8, [x20, x8, lsl #3]
0x102a2c2a8 str x27, [x28, #8]
0x102a2c2ac br x8
0x102a2c2b0 ldrb w0, [x27, #4]
0x102a2c2b4 ldr x1, [x24, x0, lsl #3]
0x102a2c2b8 ldr x2, [x27, #8]
0x102a2c2bc add x27, x27, #0x10
0x102a2c2c0 cmp w1, w2
0x102a2c2c4 b.ls #0x102a2adb8
0x102a2c2c8 ldr x3, [x27, #8]
0x102a2c2cc add x27, x27, x3, lsl #4
0x102a2c2d0 ldr w8, [x27]
0x102a2c2d4 ldr x8, [x20, x8, lsl #3]
0x102a2c2d8 str x27, [x28, #8]
0x102a2c2dc br x8
0x102a2c2e0 ldrb w0, [x27, #4]
0x102a2c2e4 ldr x1, [x24, x0, lsl #3]
0x102a2c2e8 ldr x2, [x27, #8]
0x102a2c2ec add x27, x27, #0x10
0x102a2c2f0 cmp w1, w2
0x102a2c2f4 b.hi #0x102a2adb8
0x102a2c2f8 ldr x3, [x27, #8]
0x102a2c2fc add x27, x27, x3, lsl #4
0x102a2c300 ldr w8, [x27]
0x102a2c304 ldr x8, [x20, x8, lsl #3]
0x102a2c308 str x27, [x28, #8]
0x102a2c30c br x8
0x102a2c310 ldrb w0, [x27, #4]
0x102a2c314 ldr x1, [x24, x0, lsl #3]
0x102a2c318 ldr x2, [x27, #8]
0x102a2c31c add x27, x27, #0x10
0x102a2c320 cmp w1, w2
0x102a2c324 b.lo #0x102a2adb8
0x102a2c328 ldr x3, [x27, #8]
0x102a2c32c add x27, x27, x3, lsl #4
0x102a2c330 ldr w8, [x27]
0x102a2c334 ldr x8, [x20, x8, lsl #3]
0x102a2c338 str x27, [x28, #8]
0x102a2c33c br x8
0x102a2c340 ldrb w0, [x27, #4]
0x102a2c344 ldr x1, [x24, x0, lsl #3]
0x102a2c348 ldr x2, [x27, #8]
0x102a2c34c add x27, x27, #0x10
0x102a2c350 cmp w1, w2
0x102a2c354 b.hs #0x102a2adb8
0x102a2c358 ldr x3, [x27, #8]
0x102a2c35c add x27, x27, x3, lsl #4
0x102a2c360 ldr w8, [x27]
0x102a2c364 ldr x8, [x20, x8, lsl #3]
0x102a2c368 str x27, [x28, #8]
0x102a2c36c br x8
