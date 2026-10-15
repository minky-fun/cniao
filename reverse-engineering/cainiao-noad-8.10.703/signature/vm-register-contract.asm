0x102a2aee8 ldr x0, [x27, #8]
0x102a2aeec add x27, x27, x0, lsl #4
0x102a2aef0 ldr w8, [x27]
0x102a2aef4 ldr x8, [x20, x8, lsl #3]
0x102a2aef8 str x27, [x28, #8]
0x102a2aefc br x8
0x102a2af00 str x27, [x24, #0x78]
0x102a2af04 ldrb w0, [x27, #4]
0x102a2af08 ldrb w1, [x27, #5]
0x102a2af0c ldr x0, [x24, x0, lsl #3]
0x102a2af10 ldr x1, [x24, x1, lsl #3]
0x102a2af14 add x2, x0, x1
0x102a2af18 sub sp, sp, #0x40
0x102a2af1c stp d8, d9, [sp, #0x20]
0x102a2af20 stp x14, x15, [sp, #0x10]
0x102a2af24 stp x12, x13, [sp]
0x102a2af28 mov x0, x26
0x102a2af2c mov x1, x28
0x102a2af30 bl #0x102a4ea64
0x102a2af34 ldp d8, d9, [sp, #0x20]
0x102a2af38 ldp x14, x15, [sp, #0x10]
0x102a2af3c ldp x12, x13, [sp]
0x102a2af40 add sp, sp, #0x40
0x102a2af44 cbz x0, #0x102a2af5c
0x102a2af48 mov x27, x0
0x102a2af4c ldr w8, [x27]
0x102a2af50 ldr x8, [x20, x8, lsl #3]
0x102a2af54 str x27, [x28, #8]
0x102a2af58 br x8
0x102a2af5c ldr x27, [x24, #0x78]
0x102a2af60 ldr w8, [x27, #0x10]!
0x102a2af64 ldr x8, [x20, x8, lsl #3]
0x102a2af68 str x27, [x28, #8]
0x102a2af6c br x8
0x102a2af70 eor x2, x1, x1
0x102a2af74 str x2, [x28, #0x10]
0x102a2af78 stur x2, [x28, #4]
0x102a2af7c ldr x0, [x27, #8]
0x102a2af80 str x27, [x24, #0x78]
0x102a2af84 add x27, x27, x0, lsl #4
0x102a2af88 ldr w8, [x27]
0x102a2af8c ldr x8, [x20, x8, lsl #3]
0x102a2af90 str x27, [x28, #8]
0x102a2af94 br x8
0x102a2af98 str x27, [x24, #0x78]
0x102a2af9c sub sp, sp, #0x40
0x102a2afa0 stp d8, d9, [sp, #0x20]
0x102a2afa4 stp x14, x15, [sp, #0x10]
0x102a2afa8 stp x12, x13, [sp]
0x102a2afac mov x0, x26
0x102a2afb0 mov x1, x28
0x102a2afb4 ldr x2, [x27, #8]
0x102a2afb8 bl #0x102a4da04
0x102a2afbc ldp d8, d9, [sp, #0x20]
0x102a2afc0 ldp x14, x15, [sp, #0x10]
0x102a2afc4 ldp x12, x13, [sp]
0x102a2afc8 add sp, sp, #0x40
0x102a2afcc cbz x0, #0x102a2afe4
0x102a2afd0 mov x27, x0
0x102a2afd4 ldr w8, [x27]
0x102a2afd8 ldr x8, [x20, x8, lsl #3]
0x102a2afdc str x27, [x28, #8]
0x102a2afe0 br x8
0x102a2afe4 ldr x27, [x24, #0x78]
0x102a2afe8 ldr w8, [x27, #0x10]!
0x102a2afec ldr x8, [x20, x8, lsl #3]
0x102a2aff0 str x27, [x28, #8]
0x102a2aff4 br x8
0x102a2aff8 ldr x1, [x27, #8]
0x102a2affc ldrb w0, [x27, #5]
0x102a2b000 str x1, [x24, x0, lsl #3]
0x102a2b004 ldr w8, [x27, #0x10]!
0x102a2b008 ldr x8, [x20, x8, lsl #3]
0x102a2b00c str x27, [x28, #8]
0x102a2b010 br x8
0x102a2b014 ldrb w0, [x27, #4]
0x102a2b018 ldrb w1, [x27, #5]
0x102a2b01c ldr x12, [x24, x0, lsl #3]
0x102a2b020 ldr x13, [x24, x1, lsl #3]
0x102a2b024 ldr w8, [x27, #0x10]!
0x102a2b028 ldr x8, [x20, x8, lsl #3]
0x102a2b02c str x27, [x28, #8]
0x102a2b030 br x8
0x102a2b034 ldrb w0, [x27, #4]
0x102a2b038 ldr x12, [x24, x0, lsl #3]
0x102a2b03c ldr x13, [x27, #8]
0x102a2b040 ldr w8, [x27, #0x10]!
0x102a2b044 ldr x8, [x20, x8, lsl #3]
0x102a2b048 str x27, [x28, #8]
0x102a2b04c br x8
0x102a2b050 ldrb w1, [x27, #5]
0x102a2b054 ldrb w2, [x27, #6]
0x102a2b058 ldr x1, [x24, x1, lsl #3]
0x102a2b05c ldr x2, [x24, x2, lsl #3]
0x102a2b060 ldrb w0, [x27, #7]
0x102a2b064 add x1, x1, x2
0x102a2b068 str x1, [x24, x0, lsl #3]
0x102a2b06c ldr w8, [x27, #0x10]!
0x102a2b070 ldr x8, [x20, x8, lsl #3]
0x102a2b074 str x27, [x28, #8]
0x102a2b078 br x8
0x102a2b07c ldrb w1, [x27, #5]
0x102a2b080 ldrb w2, [x27, #6]
0x102a2b084 ldr x1, [x24, x1, lsl #3]
0x102a2b088 ldr x2, [x24, x2, lsl #3]
0x102a2b08c ldrb w0, [x27, #7]
0x102a2b090 sub x1, x1, x2
0x102a2b094 str x1, [x24, x0, lsl #3]
0x102a2b098 ldr w8, [x27, #0x10]!
0x102a2b09c ldr x8, [x20, x8, lsl #3]
0x102a2b0a0 str x27, [x28, #8]
0x102a2b0a4 br x8
0x102a2b0a8 ldrb w1, [x27, #5]
0x102a2b0ac ldrb w2, [x27, #6]
0x102a2b0b0 ldr x1, [x24, x1, lsl #3]
0x102a2b0b4 ldr x2, [x24, x2, lsl #3]
0x102a2b0b8 ldrb w0, [x27, #7]
0x102a2b0bc mul x1, x1, x2
0x102a2b0c0 str x1, [x24, x0, lsl #3]
0x102a2b0c4 ldr w8, [x27, #0x10]!
0x102a2b0c8 ldr x8, [x20, x8, lsl #3]
0x102a2b0cc str x27, [x28, #8]
0x102a2b0d0 br x8
0x102a2b238 ldrb w0, [x27, #5]
0x102a2b23c ldr x1, [x24, x0, lsl #3]
0x102a2b240 ldr x2, [x27, #8]
0x102a2b244 ldrb w0, [x27, #7]
0x102a2b248 mul x1, x1, x2
0x102a2b24c str x1, [x24, x0, lsl #3]
0x102a2b250 ldr w8, [x27, #0x10]!
0x102a2b254 ldr x8, [x20, x8, lsl #3]
0x102a2b258 str x27, [x28, #8]
0x102a2b25c br x8
0x102a2b334 ldrb w0, [x27, #5]
0x102a2b338 ldr x1, [x24, x0, lsl #3]
0x102a2b33c ldr x2, [x27, #8]
0x102a2b340 ldrb w0, [x27, #7]
0x102a2b344 sdiv x1, x1, x2
0x102a2b348 str x1, [x24, x0, lsl #3]
0x102a2b34c ldr w8, [x27, #0x10]!
0x102a2b350 ldr x8, [x20, x8, lsl #3]
0x102a2b354 str x27, [x28, #8]
0x102a2b358 br x8
0x102a2b38c ldrb w1, [x27, #5]
0x102a2b390 ldrb w2, [x27, #6]
0x102a2b394 ldr x1, [x24, x1, lsl #3]
0x102a2b398 ldr x2, [x24, x2, lsl #3]
0x102a2b39c ldrb w0, [x27, #7]
0x102a2b3a0 and x1, x1, x2
0x102a2b3a4 str x1, [x24, x0, lsl #3]
0x102a2b3a8 ldr w8, [x27, #0x10]!
0x102a2b3ac ldr x8, [x20, x8, lsl #3]
0x102a2b3b0 str x27, [x28, #8]
0x102a2b3b4 br x8
0x102a2b5d4 ldrb w0, [x27, #5]
0x102a2b5d8 ldr x1, [x24, x0, lsl #3]
0x102a2b5dc ldr x2, [x27, #8]
0x102a2b5e0 ldrb w0, [x27, #7]
0x102a2b5e4 orr x1, x1, x2
0x102a2b5e8 str x1, [x24, x0, lsl #3]
0x102a2b5ec ldr w8, [x27, #0x10]!
0x102a2b5f0 ldr x8, [x20, x8, lsl #3]
0x102a2b5f4 str x27, [x28, #8]
0x102a2b5f8 br x8
0x102a2b628 ldrb w0, [x27, #5]
0x102a2b62c ldr x1, [x24, x0, lsl #3]
0x102a2b630 ldr x2, [x27, #8]
0x102a2b634 ldrb w0, [x27, #7]
0x102a2b638 eor x1, x1, x2
0x102a2b63c str x1, [x24, x0, lsl #3]
0x102a2b640 ldr w8, [x27, #0x10]!
0x102a2b644 ldr x8, [x20, x8, lsl #3]
0x102a2b648 str x27, [x28, #8]
0x102a2b64c br x8
0x102a2b650 ldrb w0, [x27, #5]
0x102a2b654 ldr x1, [x24, x0, lsl #3]
0x102a2b658 ldr x2, [x27, #8]
0x102a2b65c ldrb w0, [x27, #7]
0x102a2b660 lsl w1, w1, w2
0x102a2b664 ubfx x1, x1, #0, #0x20
0x102a2b668 str x1, [x24, x0, lsl #3]
0x102a2b66c ldr w8, [x27, #0x10]!
0x102a2b670 ldr x8, [x20, x8, lsl #3]
0x102a2b674 str x27, [x28, #8]
0x102a2b678 br x8
0x102a2b67c ldrb w0, [x27, #5]
0x102a2b680 ldr x1, [x24, x0, lsl #3]
0x102a2b684 ldr x2, [x27, #8]
0x102a2b688 ldrb w0, [x27, #7]
0x102a2b68c lsl x1, x1, x2
0x102a2b690 str x1, [x24, x0, lsl #3]
0x102a2b694 ldr w8, [x27, #0x10]!
0x102a2b698 ldr x8, [x20, x8, lsl #3]
0x102a2b69c str x27, [x28, #8]
0x102a2b6a0 br x8
0x102a2b6a4 ldrb w0, [x27, #5]
0x102a2b6a8 ldr x1, [x24, x0, lsl #3]
0x102a2b6ac ldr x2, [x27, #8]
0x102a2b6b0 ldrb w0, [x27, #7]
0x102a2b6b4 lsr w1, w1, w2
0x102a2b6b8 ubfx x1, x1, #0, #0x20
0x102a2b6bc str x1, [x24, x0, lsl #3]
0x102a2b6c0 ldr w8, [x27, #0x10]!
0x102a2b6c4 ldr x8, [x20, x8, lsl #3]
0x102a2b6c8 str x27, [x28, #8]
0x102a2b6cc br x8
0x102a2b6d0 ldrb w0, [x27, #5]
0x102a2b6d4 ldr x1, [x24, x0, lsl #3]
0x102a2b6d8 ldr x2, [x27, #8]
0x102a2b6dc ldrb w0, [x27, #7]
0x102a2b6e0 lsr x1, x1, x2
0x102a2b6e4 str x1, [x24, x0, lsl #3]
0x102a2b6e8 ldr w8, [x27, #0x10]!
0x102a2b6ec ldr x8, [x20, x8, lsl #3]
0x102a2b6f0 str x27, [x28, #8]
0x102a2b6f4 br x8
0x102a2b6f8 ldrb w0, [x27, #5]
0x102a2b6fc ldr x1, [x24, x0, lsl #3]
0x102a2b700 ldr x2, [x27, #8]
0x102a2b704 ldrb w0, [x27, #7]
0x102a2b708 asr w1, w1, w2
0x102a2b70c sxtw x1, w1
0x102a2b710 str x1, [x24, x0, lsl #3]
0x102a2b714 ldr w8, [x27, #0x10]!
0x102a2b718 ldr x8, [x20, x8, lsl #3]
0x102a2b71c str x27, [x28, #8]
0x102a2b720 br x8
0x102a2c398 cmp x12, x13
0x102a2c39c b.ne #0x102a2adb8
0x102a2c3a0 ldrb w1, [x27, #5]
0x102a2c3a4 ldrb w0, [x27, #6]
0x102a2c3a8 ldr x1, [x24, x1, lsl #3]
0x102a2c3ac str x1, [x24, x0, lsl #3]
0x102a2c3b0 ldr w8, [x27, #0x10]!
0x102a2c3b4 ldr x8, [x20, x8, lsl #3]
0x102a2c3b8 str x27, [x28, #8]
0x102a2c3bc br x8
0x102a2c528 cmp w12, w13
0x102a2c52c b.ne #0x102a2adb8
0x102a2c530 ldrb w1, [x27, #5]
0x102a2c534 ldrb w0, [x27, #6]
0x102a2c538 ldr x1, [x24, x1, lsl #3]
0x102a2c53c str x1, [x24, x0, lsl #3]
0x102a2c540 ldr w8, [x27, #0x10]!
0x102a2c544 ldr x8, [x20, x8, lsl #3]
0x102a2c548 str x27, [x28, #8]
0x102a2c54c br x8
0x102a2c81c cmp w12, w13
0x102a2c820 b.ne #0x102a2adb8
0x102a2c824 ldrb w0, [x27, #6]
0x102a2c828 ldr x1, [x27, #8]
0x102a2c82c str x1, [x24, x0, lsl #3]
0x102a2c830 ldr w8, [x27, #0x10]!
0x102a2c834 ldr x8, [x20, x8, lsl #3]
0x102a2c838 str x27, [x28, #8]
0x102a2c83c br x8
