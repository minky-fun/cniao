
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

00000001023e5330 <___cxa_throw>:
102a2b7d0: 39401761    	ldrb	w1, [x27, #0x5]
102a2b7d4: 39401b62    	ldrb	w2, [x27, #0x6]
102a2b7d8: f8617b01    	ldr	x1, [x24, x1, lsl #3]
102a2b7dc: f8627b02    	ldr	x2, [x24, x2, lsl #3]
102a2b7e0: 39401f60    	ldrb	w0, [x27, #0x7]
102a2b7e4: f8626821    	ldr	x1, [x1, x2]
102a2b7e8: f8207b01    	str	x1, [x24, x0, lsl #3]
102a2b7ec: b8410f68    	ldr	w8, [x27, #0x10]!
102a2b7f0: f8687a88    	ldr	x8, [x20, x8, lsl #3]
102a2b7f4: f900079b    	str	x27, [x28, #0x8]
102a2b7f8: d61f0100    	br	x8
