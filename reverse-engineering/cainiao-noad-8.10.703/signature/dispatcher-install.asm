
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abb810: aa1403e0    	mov	x0, x20
102abb814: 9465d82d    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102abb818: aa0003f5    	mov	x21, x0
102abb81c: 97ffb885    	bl	0x102aa9a30 <_CMa03SUie28mjv+0x445f8>
102abb820: 528014a8    	mov	w8, #0xa5               ; =165
102abb824: b81a43a8    	stur	w8, [x29, #-0x5c]
102abb828: d10173a8    	sub	x8, x29, #0x5c
102abb82c: 10000025    	adr	x5, 0x102abb830 <_CMa03SUie28mjv+0x563f8>
102abb830: 980000cd    	ldrsw	x13, 0x102abb848 <_CMa03SUie28mjv+0x56410>
102abb834: b980011b    	ldrsw	x27, [x8]
102abb838: cb1b01ad    	sub	x13, x13, x27
102abb83c: 8b0d00a5    	add	x5, x5, x13
102abb840: d28013e8    	mov	x8, #0x9f               ; =159
102abb844: d61f00a0    	br	x5
102abb848: 000000d1    	udf	#0xd1
102abb84c: 2be47d30    	<unknown>
102abb850: 78a0fc92    	<unknown>
102abb854: 079a712b    	<unknown>
102abb858: 028972d1    	<unknown>
102abb85c: f001f1c9    	adrp	x9, 0x1068f6000 <dyld_stub_binder+0x1068f6000>
102abb860: 10125a68    	adr	x8, 0x102ae03ac <_CMa03SUie28mjv+0x7af74>
102abb864: d503201f    	nop
102abb868: f903c528    	str	x8, [x9, #0x788]
102abb86c: 94009431    	bl	0x102ae0930 <_CMa03SUie28mjv+0x7b4f8>
102abb870: 9001bfdc    	adrp	x28, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102abb874: f942bb94    	ldr	x20, [x28, #0x570]
102abb878: d001bac8    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102abb87c: f9404116    	ldr	x22, [x8, #0x80]
