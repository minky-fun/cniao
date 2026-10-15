
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ae051c: d10083ff    	sub	sp, sp, #0x20
102ae0520: a9016ffc    	stp	x28, x27, [sp, #0x10]
102ae0524: aa0103e8    	mov	x8, x1
102ae0528: aa0003e4    	mov	x4, x0
102ae052c: 528000a9    	mov	w9, #0x5                ; =5
102ae0530: b9000be9    	str	w9, [sp, #0x8]
102ae0534: 910023e9    	add	x9, sp, #0x8
102ae0538: 1000003c    	adr	x28, 0x102ae053c <_CMa03SUie28mjv+0x7b104>
102ae053c: 9800010f    	ldrsw	x15, 0x102ae055c <_CMa03SUie28mjv+0x7b124>
102ae0540: aa2f03ef    	mvn	x15, x15
102ae0544: 910169ef    	add	x15, x15, #0x5a
102ae0548: b9800130    	ldrsw	x16, [x9]
102ae054c: ca1001ef    	eor	x15, x15, x16
102ae0550: 8b0f039c    	add	x28, x28, x15
102ae0554: d2801d69    	mov	x9, #0xeb               ; =235
102ae0558: d61f0380    	br	x28
102ae055c: 00000028    	udf	#0x28
102ae0560: 9e752336    	<unknown>
102ae0564: 3ef66260    	<unknown>
102ae0568: be48f86e    	<unknown>
102ae056c: 22d35413    	<unknown>
102ae0570: 528014aa    	mov	w10, #0xa5              ; =165
102ae0574: b9000fea    	str	w10, [sp, #0xc]
102ae0578: 910033ea    	add	x10, sp, #0xc
102ae057c: 10000025    	adr	x5, 0x102ae0580 <_CMa03SUie28mjv+0x7b148>
102ae0580: 980000cd    	ldrsw	x13, 0x102ae0598 <_CMa03SUie28mjv+0x7b160>
102ae0584: b980015b    	ldrsw	x27, [x10]
102ae0588: cb1b01ad    	sub	x13, x13, x27
102ae058c: 8b0d00a5    	add	x5, x5, x13
102ae0590: d28013ea    	mov	x10, #0x9f              ; =159
102ae0594: d61f00a0    	br	x5
102ae0598: 000000d1    	udf	#0xd1
102ae059c: 2be47d30    	<unknown>
102ae05a0: 78a0fc92    	<unknown>
102ae05a4: 079a712b    	<unknown>
102ae05a8: 028972d1    	<unknown>
102ae05ac: b001f0aa    	adrp	x10, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102ae05b0: f947214a    	ldr	x10, [x10, #0xe40]
102ae05b4: 93407d29    	sxtw	x9, w9
102ae05b8: 52801d6b    	mov	w11, #0xeb              ; =235
102ae05bc: ca0b0129    	eor	x9, x9, x11
102ae05c0: 8b091549    	add	x9, x10, x9, lsl #5
102ae05c4: f9400926    	ldr	x6, [x9, #0x10]
102ae05c8: 52800020    	mov	w0, #0x1                ; =1
102ae05cc: 52800081    	mov	w1, #0x4                ; =4
102ae05d0: 52800022    	mov	w2, #0x1                ; =1
102ae05d4: 52800003    	mov	w3, #0x0                ; =0
102ae05d8: aa0803e5    	mov	x5, x8
102ae05dc: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102ae05e0: 910083ff    	add	sp, sp, #0x20
102ae05e4: d61f00c0    	br	x6
