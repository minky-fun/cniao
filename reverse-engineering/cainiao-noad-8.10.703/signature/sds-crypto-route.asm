
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abc330: d10103ff    	sub	sp, sp, #0x40
102abc334: a9016ffc    	stp	x28, x27, [sp, #0x10]
102abc338: a9024ff4    	stp	x20, x19, [sp, #0x20]
102abc33c: a9037bfd    	stp	x29, x30, [sp, #0x30]
102abc340: 9100c3fd    	add	x29, sp, #0x30
102abc344: aa0103f3    	mov	x19, x1
102abc348: 52800ca8    	mov	w8, #0x65               ; =101
102abc34c: b90007e8    	str	w8, [sp, #0x4]
102abc350: 910013e8    	add	x8, sp, #0x4
102abc354: 10000025    	adr	x5, 0x102abc358 <_CMa03SUie28mjv+0x56f20>
102abc358: 980000cd    	ldrsw	x13, 0x102abc370 <_CMa03SUie28mjv+0x56f38>
102abc35c: b980011b    	ldrsw	x27, [x8]
102abc360: cb1b01ad    	sub	x13, x13, x27
102abc364: 8b0d00a5    	add	x5, x5, x13
102abc368: d28013e8    	mov	x8, #0x9f               ; =159
102abc36c: d61f00a0    	br	x5
102abc370: 00000095    	udf	#0x95
102abc374: 2be47d30    	<unknown>
102abc378: 78a0fc92    	<unknown>
102abc37c: 079a712b    	<unknown>
102abc380: 028972d1    	<unknown>
102abc384: df7de61d    	<unknown>
102abc388: b4000081    	cbz	x1, 0x102abc398 <_CMa03SUie28mjv+0x56f60>
102abc38c: 52906408    	mov	w8, #0x8320             ; =33568
102abc390: 72a00188    	movk	w8, #0xc, lsl #16
102abc394: b9000268    	str	w8, [x19]
102abc398: b40000c0    	cbz	x0, 0x102abc3b0 <_CMa03SUie28mjv+0x56f78>
102abc39c: f9401014    	ldr	x20, [x0, #0x20]
102abc3a0: b4000094    	cbz	x20, 0x102abc3b0 <_CMa03SUie28mjv+0x56f78>
102abc3a4: b9400401    	ldr	w1, [x0, #0x4]
102abc3a8: 7100743f    	cmp	w1, #0x1d
102abc3ac: 540000e3    	b.lo	0x102abc3c8 <_CMa03SUie28mjv+0x56f90>
102abc3b0: b4000ad3    	cbz	x19, 0x102abc508 <_CMa03SUie28mjv+0x570d0>
102abc3b4: d2800014    	mov	x20, #0x0               ; =0
102abc3b8: 52929208    	mov	w8, #0x9490             ; =38032
102abc3bc: 72a001a8    	movk	w8, #0xd, lsl #16
102abc3c0: b9000268    	str	w8, [x19]
102abc3c4: 14000061    	b	0x102abc548 <_CMa03SUie28mjv+0x57110>
102abc3c8: 7100583f    	cmp	w1, #0x16
102abc3cc: 5400016a    	b.ge	0x102abc3f8 <_CMa03SUie28mjv+0x56fc0>
102abc3d0: 71004c3f    	cmp	w1, #0x13
102abc3d4: 5400020a    	b.ge	0x102abc414 <_CMa03SUie28mjv+0x56fdc>
102abc3d8: 71003c3f    	cmp	w1, #0xf
102abc3dc: 5400052c    	b.gt	0x102abc480 <_CMa03SUie28mjv+0x57048>
102abc3e0: 71000c3f    	cmp	w1, #0x3
102abc3e4: 540008a1    	b.ne	0x102abc4f8 <_CMa03SUie28mjv+0x570c0>
102abc3e8: f9400c00    	ldr	x0, [x0, #0x18]
102abc3ec: aa1403e1    	mov	x1, x20
102abc3f0: 97ff30c4    	bl	0x102a88700 <_CMa03SUie28mjv+0x232c8>
102abc3f4: 14000051    	b	0x102abc538 <_CMa03SUie28mjv+0x57100>
102abc3f8: 7100643f    	cmp	w1, #0x19
102abc3fc: 540003aa    	b.ge	0x102abc470 <_CMa03SUie28mjv+0x57038>
102abc400: 71005c3f    	cmp	w1, #0x17
102abc404: 540004ea    	b.ge	0x102abc4a0 <_CMa03SUie28mjv+0x57068>
102abc408: aa1403e0    	mov	x0, x20
102abc40c: 94005fa8    	bl	0x102ad42ac <_CMa03SUie28mjv+0x6ee74>
102abc410: 1400004a    	b	0x102abc538 <_CMa03SUie28mjv+0x57100>
102abc414: 54000501    	b.ne	0x102abc4b4 <_CMa03SUie28mjv+0x5707c>
102abc418: 52800da8    	mov	w8, #0x6d               ; =109
102abc41c: b9000be8    	str	w8, [sp, #0x8]
102abc420: 910033ea    	add	x10, sp, #0xc
102abc424: 910023eb    	add	x11, sp, #0x8
102abc428: 1000003b    	adr	x27, 0x102abc42c <_CMa03SUie28mjv+0x56ff4>
102abc42c: 98000151    	ldrsw	x17, 0x102abc454 <_CMa03SUie28mjv+0x5701c>
102abc430: d2800148    	mov	x8, #0xa                ; =10
102abc434: ca080231    	eor	x17, x17, x8
102abc438: aa3103f1    	mvn	x17, x17
102abc43c: b9800166    	ldrsw	x6, [x11]
102abc440: 8b060231    	add	x17, x17, x6
102abc444: 8b11037b    	add	x27, x27, x17
102abc448: 528010a9    	mov	w9, #0x85               ; =133
102abc44c: b9000149    	str	w9, [x10]
102abc450: d61f0360    	br	x27
102abc454: 0000003e    	udf	#0x3e
102abc458: 7ff7a299    	<unknown>
102abc45c: 81fc6f81    	<unknown>
102abc460: 759bd7d3    	<unknown>
102abc464: aa1403e0    	mov	x0, x20
102abc468: 97ff2a56    	bl	0x102a86dc0 <_CMa03SUie28mjv+0x21988>
102abc46c: 14000034    	b	0x102abc53c <_CMa03SUie28mjv+0x57104>
102abc470: 540002e1    	b.ne	0x102abc4cc <_CMa03SUie28mjv+0x57094>
102abc474: aa1403e0    	mov	x0, x20
102abc478: 97ff4909    	bl	0x102a8e89c <_CMa03SUie28mjv+0x29464>
102abc47c: 1400002f    	b	0x102abc538 <_CMa03SUie28mjv+0x57100>
102abc480: b9400008    	ldr	w8, [x0]
102abc484: b9400802    	ldr	w2, [x0, #0x8]
102abc488: a9411003    	ldp	x3, x4, [x0, #0x10]
102abc48c: aa0803e0    	mov	x0, x8
102abc490: aa1403e5    	mov	x5, x20
102abc494: aa1303e6    	mov	x6, x19


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abc724: 10ffe064    	adr	x4, 0x102abc330 <_CMa03SUie28mjv+0x56ef8>
102abc728: d503201f    	nop
102abc72c: 52800020    	mov	w0, #0x1                ; =1
102abc730: 52800041    	mov	w1, #0x2                ; =2
102abc734: 52800022    	mov	w2, #0x1                ; =1
102abc738: 52800003    	mov	w3, #0x0                ; =0
102abc73c: d63f0100    	blr	x8
102abc740: f8746a65    	ldr	x5, [x19, x20]
