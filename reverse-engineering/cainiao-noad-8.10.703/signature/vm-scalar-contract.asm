0x102a2b1e8 ldrb w0, [x27, #5]
0x102a2b1ec ldr x1, [x24, x0, lsl #3]
0x102a2b1f0 ldr x2, [x27, #8]
0x102a2b1f4 ldrb w0, [x27, #7]
0x102a2b1f8 add x1, x1, x2
0x102a2b1fc str x1, [x24, x0, lsl #3]
0x102a2b200 ldr w8, [x27, #0x10]!
0x102a2b204 ldr x8, [x20, x8, lsl #3]
0x102a2b208 str x27, [x28, #8]
0x102a2b20c br x8
0x102a2b3b8 ldrb w1, [x27, #5]
0x102a2b3bc ldrb w2, [x27, #6]
0x102a2b3c0 ldr x1, [x24, x1, lsl #3]
0x102a2b3c4 ldr x2, [x24, x2, lsl #3]
0x102a2b3c8 ldrb w0, [x27, #7]
0x102a2b3cc orr x1, x1, x2
0x102a2b3d0 str x1, [x24, x0, lsl #3]
0x102a2b3d4 ldr w8, [x27, #0x10]!
0x102a2b3d8 ldr x8, [x20, x8, lsl #3]
0x102a2b3dc str x27, [x28, #8]
0x102a2b3e0 br x8
0x102a2b3e4 ldrb w1, [x27, #5]
0x102a2b3e8 ldrb w2, [x27, #6]
0x102a2b3ec ldr x1, [x24, x1, lsl #3]
0x102a2b3f0 ldr x2, [x24, x2, lsl #3]
0x102a2b3f4 ldrb w0, [x27, #7]
0x102a2b3f8 orr x1, x1, x2
0x102a2b3fc str x1, [x24, x0, lsl #3]
0x102a2b400 ldr w8, [x27, #0x10]!
0x102a2b404 ldr x8, [x20, x8, lsl #3]
0x102a2b408 str x27, [x28, #8]
0x102a2b40c br x8
0x102a2b410 ldrb w1, [x27, #5]
0x102a2b414 ldrb w2, [x27, #6]
0x102a2b418 ldr x1, [x24, x1, lsl #3]
0x102a2b41c ldr x2, [x24, x2, lsl #3]
0x102a2b420 ldrb w0, [x27, #7]
0x102a2b424 eor x1, x1, x2
0x102a2b428 and x1, x1, #0xffffffff
0x102a2b42c str x1, [x24, x0, lsl #3]
0x102a2b430 ldr w8, [x27, #0x10]!
0x102a2b434 ldr x8, [x20, x8, lsl #3]
0x102a2b438 str x27, [x28, #8]
0x102a2b43c br x8
0x102a2b580 ldrb w0, [x27, #5]
0x102a2b584 ldr x1, [x24, x0, lsl #3]
0x102a2b588 ldr x2, [x27, #8]
0x102a2b58c ldrb w0, [x27, #7]
0x102a2b590 and x1, x1, x2
0x102a2b594 and x1, x1, #0xffffffff
0x102a2b598 str x1, [x24, x0, lsl #3]
0x102a2b59c ldr w8, [x27, #0x10]!
0x102a2b5a0 ldr x8, [x20, x8, lsl #3]
0x102a2b5a4 str x27, [x28, #8]
0x102a2b5a8 br x8
0x102a2b5ac ldrb w0, [x27, #5]
0x102a2b5b0 ldr x1, [x24, x0, lsl #3]
0x102a2b5b4 ldr x2, [x27, #8]
0x102a2b5b8 ldrb w0, [x27, #7]
0x102a2b5bc and x1, x1, x2
0x102a2b5c0 str x1, [x24, x0, lsl #3]
0x102a2b5c4 ldr w8, [x27, #0x10]!
0x102a2b5c8 ldr x8, [x20, x8, lsl #3]
0x102a2b5cc str x27, [x28, #8]
0x102a2b5d0 br x8
