
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa937c: d101c3ff    	sub	sp, sp, #0x70
102aa9380: a9016ffc    	stp	x28, x27, [sp, #0x10]
102aa9384: a90267fa    	stp	x26, x25, [sp, #0x20]
102aa9388: a9035ff8    	stp	x24, x23, [sp, #0x30]
102aa938c: a90457f6    	stp	x22, x21, [sp, #0x40]
102aa9390: a9054ff4    	stp	x20, x19, [sp, #0x50]
102aa9394: a9067bfd    	stp	x29, x30, [sp, #0x60]
102aa9398: 910183fd    	add	x29, sp, #0x60
102aa939c: aa0503f3    	mov	x19, x5
102aa93a0: aa0403f7    	mov	x23, x4
102aa93a4: aa0303f4    	mov	x20, x3
102aa93a8: aa0203f5    	mov	x21, x2
102aa93ac: aa0103f6    	mov	x22, x1
102aa93b0: aa0003f8    	mov	x24, x0
102aa93b4: 528014a8    	mov	w8, #0xa5               ; =165
102aa93b8: b9000fe8    	str	w8, [sp, #0xc]
102aa93bc: 910033e8    	add	x8, sp, #0xc
102aa93c0: 10000025    	adr	x5, 0x102aa93c4 <_CMa03SUie28mjv+0x43f8c>
102aa93c4: 980000cd    	ldrsw	x13, 0x102aa93dc <_CMa03SUie28mjv+0x43fa4>
102aa93c8: b980011b    	ldrsw	x27, [x8]
102aa93cc: cb1b01ad    	sub	x13, x13, x27
102aa93d0: 8b0d00a5    	add	x5, x5, x13
102aa93d4: d28013e8    	mov	x8, #0x9f               ; =159
102aa93d8: d61f00a0    	br	x5
102aa93dc: 000000cd    	udf	#0xcd
102aa93e0: 2be47d30    	<unknown>
102aa93e4: 78a0fc92    	<unknown>
102aa93e8: 079a712b    	<unknown>
102aa93ec: 7101a11f    	cmp	w8, #0x68
102aa93f0: 540001cb    	b.lt	0x102aa9428 <_CMa03SUie28mjv+0x43ff0>
102aa93f4: 5284e209    	mov	w9, #0x2710             ; =10000
102aa93f8: 1b097eca    	mul	w10, w22, w9
102aa93fc: 52800c8b    	mov	w11, #0x64              ; =100
102aa9400: 1b0b2aaa    	madd	w10, w21, w11, w10
102aa9404: 0b14014a    	add	w10, w10, w20
102aa9408: 1b097d5a    	mul	w26, w10, w9
102aa940c: 93407d08    	sxtw	x8, w8
102aa9410: 528013e9    	mov	w9, #0x9f               ; =159
102aa9414: ca090108    	eor	x8, x8, x9
102aa9418: 8b081b08    	add	x8, x24, x8, lsl #6
102aa941c: b940090a    	ldr	w10, [x8, #0x8]
102aa9420: 7100055f    	cmp	w10, #0x1
102aa9424: 540001ab    	b.lt	0x102aa9458 <_CMa03SUie28mjv+0x44020>
102aa9428: d2800008    	mov	x8, #0x0                ; =0
102aa942c: f9400309    	ldr	x9, [x24]
102aa9430: 93407d4a    	sxtw	x10, w10
102aa9434: f8687939    	ldr	x25, [x9, x8, lsl #3]
102aa9438: b940032b    	ldr	w11, [x25]
102aa943c: 6b16017f    	cmp	w11, w22
102aa9440: 540000a0    	b.eq	0x102aa9454 <_CMa03SUie28mjv+0x4401c>
102aa9444: 91000508    	add	x8, x8, #0x1
102aa9448: eb0a011f    	cmp	x8, x10
102aa944c: 54ffff4b    	b.lt	0x102aa9434 <_CMa03SUie28mjv+0x43ffc>
102aa9450: 14000002    	b	0x102aa9458 <_CMa03SUie28mjv+0x44020>
102aa9454: b50001f9    	cbnz	x25, 0x102aa9490 <_CMa03SUie28mjv+0x44058>
102aa9458: 34000677    	cbz	w23, 0x102aa9524 <_CMa03SUie28mjv+0x440ec>
102aa945c: 52800200    	mov	w0, #0x10               ; =16
102aa9460: 94661fd0    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102aa9464: b4000ee0    	cbz	x0, 0x102aa9640 <_CMa03SUie28mjv+0x44208>
102aa9468: aa0003f9    	mov	x25, x0
102aa946c: 29007c16    	stp	w22, wzr, [x0]
102aa9470: 52800400    	mov	w0, #0x20               ; =32
102aa9474: d2800001    	mov	x1, #0x0                ; =0
102aa9478: 9400915e    	bl	0x102acd9f0 <_CMa03SUie28mjv+0x685b8>
102aa947c: f9000720    	str	x0, [x25, #0x8]
102aa9480: f9400f08    	ldr	x8, [x24, #0x18]
102aa9484: aa1803e0    	mov	x0, x24
102aa9488: aa1903e1    	mov	x1, x25
102aa948c: d63f0100    	blr	x8
102aa9490: f9400729    	ldr	x9, [x25, #0x8]
102aa9494: b9400928    	ldr	w8, [x9, #0x8]
102aa9498: 7100051f    	cmp	w8, #0x1
102aa949c: 5400018b    	b.lt	0x102aa94cc <_CMa03SUie28mjv+0x44094>
102aa94a0: f9400129    	ldr	x9, [x9]
102aa94a4: b001544a    	adrp	x10, 0x105532000 <dyld_stub_binder+0x105532000>
102aa94a8: f9429d5f    	ldr	xzr, [x10, #0x538]
102aa94ac: f9400138    	ldr	x24, [x9]
102aa94b0: b4000098    	cbz	x24, 0x102aa94c0 <_CMa03SUie28mjv+0x44088>
102aa94b4: b940070a    	ldr	w10, [x24, #0x4]
102aa94b8: 6b15015f    	cmp	w10, w21
102aa94bc: 540003c0    	b.eq	0x102aa9534 <_CMa03SUie28mjv+0x440fc>
102aa94c0: 91002129    	add	x9, x9, #0x8
102aa94c4: f1000508    	subs	x8, x8, #0x1
102aa94c8: 54ffff21    	b.ne	0x102aa94ac <_CMa03SUie28mjv+0x44074>
102aa94cc: 34000317    	cbz	w23, 0x102aa952c <_CMa03SUie28mjv+0x440f4>
102aa94d0: 52800300    	mov	w0, #0x18               ; =24
102aa94d4: 94661fb3    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102aa94d8: b4000b60    	cbz	x0, 0x102aa9644 <_CMa03SUie28mjv+0x4420c>
102aa94dc: aa0003f8    	mov	x24, x0
102aa94e0: 29005416    	stp	w22, w21, [x0]
102aa94e4: d2800000    	mov	x0, #0x0                ; =0
102aa94e8: 94662539    	bl	0x1044329cc <dyld_stub_binder+0x1044329cc>
102aa94ec: 946622f2    	bl	0x1044320b4 <dyld_stub_binder+0x1044320b4>
102aa94f0: 94661f73    	bl	0x1044312bc <dyld_stub_binder+0x1044312bc>
102aa94f4: f9000700    	str	x0, [x24, #0x8]
102aa94f8: 52800400    	mov	w0, #0x20               ; =32
102aa94fc: d2800001    	mov	x1, #0x0                ; =0
102aa9500: 9400913c    	bl	0x102acd9f0 <_CMa03SUie28mjv+0x685b8>
102aa9504: f9000b00    	str	x0, [x24, #0x10]
102aa9508: f9400720    	ldr	x0, [x25, #0x8]
102aa950c: f9400c08    	ldr	x8, [x0, #0x18]
102aa9510: aa1803e1    	mov	x1, x24
102aa9514: d63f0100    	blr	x8
102aa9518: b0015448    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102aa951c: f942911f    	ldr	xzr, [x8, #0x520]
102aa9520: 14000008    	b	0x102aa9540 <_CMa03SUie28mjv+0x44108>
102aa9524: 5284d608    	mov	w8, #0x26b0             ; =9904
102aa9528: 1400003d    	b	0x102aa961c <_CMa03SUie28mjv+0x441e4>
102aa952c: 5284d628    	mov	w8, #0x26b1             ; =9905
102aa9530: 1400003b    	b	0x102aa961c <_CMa03SUie28mjv+0x441e4>
102aa9534: b9400308    	ldr	w8, [x24]
102aa9538: 6b16011f    	cmp	w8, w22
102aa953c: 54000861    	b.ne	0x102aa9648 <_CMa03SUie28mjv+0x44210>
102aa9540: f9400b09    	ldr	x9, [x24, #0x10]
102aa9544: b9400928    	ldr	w8, [x9, #0x8]
102aa9548: 7100051f    	cmp	w8, #0x1
102aa954c: 540001eb    	b.lt	0x102aa9588 <_CMa03SUie28mjv+0x44150>
102aa9550: f940012a    	ldr	x10, [x9]
102aa9554: b001544b    	adrp	x11, 0x105532000 <dyld_stub_binder+0x105532000>
102aa9558: b001544c    	adrp	x12, 0x105532000 <dyld_stub_binder+0x105532000>
102aa955c: f9400149    	ldr	x9, [x10]
102aa9560: b40000c9    	cbz	x9, 0x102aa9578 <_CMa03SUie28mjv+0x44140>
102aa9564: f942999f    	ldr	xzr, [x12, #0x530]
102aa9568: b940092d    	ldr	w13, [x9, #0x8]
102aa956c: 6b1401bf    	cmp	w13, w20
102aa9570: 54000061    	b.ne	0x102aa957c <_CMa03SUie28mjv+0x44144>
102aa9574: 14000007    	b	0x102aa9590 <_CMa03SUie28mjv+0x44158>
102aa9578: f942957f    	ldr	xzr, [x11, #0x528]
102aa957c: 9100214a    	add	x10, x10, #0x8
102aa9580: f1000508    	subs	x8, x8, #0x1
102aa9584: 54fffec1    	b.ne	0x102aa955c <_CMa03SUie28mjv+0x44124>
102aa9588: d2800009    	mov	x9, #0x0                ; =0
102aa958c: 14000007    	b	0x102aa95a8 <_CMa03SUie28mjv+0x44170>
102aa9590: b9400128    	ldr	w8, [x9]
102aa9594: 6b16011f    	cmp	w8, w22
102aa9598: 540005a1    	b.ne	0x102aa964c <_CMa03SUie28mjv+0x44214>
102aa959c: b9400528    	ldr	w8, [x9, #0x4]
102aa95a0: 6b15011f    	cmp	w8, w21
102aa95a4: 54000561    	b.ne	0x102aa9650 <_CMa03SUie28mjv+0x44218>
102aa95a8: 34000097    	cbz	w23, 0x102aa95b8 <_CMa03SUie28mjv+0x44180>
102aa95ac: b4000149    	cbz	x9, 0x102aa95d4 <_CMa03SUie28mjv+0x4419c>
102aa95b0: 5284e1e8    	mov	w8, #0x270f             ; =9999
102aa95b4: 1400001a    	b	0x102aa961c <_CMa03SUie28mjv+0x441e4>
102aa95b8: b4000309    	cbz	x9, 0x102aa9618 <_CMa03SUie28mjv+0x441e0>
102aa95bc: 52800000    	mov	w0, #0x0                ; =0
102aa95c0: f9400928    	ldr	x8, [x9, #0x10]
102aa95c4: f9400709    	ldr	x9, [x24, #0x8]
102aa95c8: ca080128    	eor	x8, x9, x8
102aa95cc: f9000268    	str	x8, [x19]
102aa95d0: 14000014    	b	0x102aa9620 <_CMa03SUie28mjv+0x441e8>
102aa95d4: 52800300    	mov	w0, #0x18               ; =24
102aa95d8: 94661f72    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102aa95dc: b40003c0    	cbz	x0, 0x102aa9654 <_CMa03SUie28mjv+0x4421c>
102aa95e0: aa0003f7    	mov	x23, x0
102aa95e4: b900141f    	str	wzr, [x0, #0x14]
102aa95e8: f800c01f    	stur	xzr, [x0, #0xc]
102aa95ec: 29005416    	stp	w22, w21, [x0]
102aa95f0: b9000814    	str	w20, [x0, #0x8]
102aa95f4: f9400b00    	ldr	x0, [x24, #0x10]
102aa95f8: f9400c08    	ldr	x8, [x0, #0x18]
102aa95fc: aa1703e1    	mov	x1, x23
102aa9600: d63f0100    	blr	x8
102aa9604: 52800000    	mov	w0, #0x0                ; =0
102aa9608: f9400708    	ldr	x8, [x24, #0x8]
102aa960c: ca130108    	eor	x8, x8, x19
102aa9610: f9000ae8    	str	x8, [x23, #0x10]
102aa9614: 14000003    	b	0x102aa9620 <_CMa03SUie28mjv+0x441e8>
102aa9618: 5284d648    	mov	w8, #0x26b2             ; =9906
102aa961c: 0b080340    	add	w0, w26, w8
102aa9620: a9467bfd    	ldp	x29, x30, [sp, #0x60]
102aa9624: a9454ff4    	ldp	x20, x19, [sp, #0x50]
102aa9628: a94457f6    	ldp	x22, x21, [sp, #0x40]
102aa962c: a9435ff8    	ldp	x24, x23, [sp, #0x30]
102aa9630: a94267fa    	ldp	x26, x25, [sp, #0x20]
102aa9634: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102aa9638: 9101c3ff    	add	sp, sp, #0x70
102aa963c: d65f03c0    	ret
102aa9640: 94659a41    	bl	0x10440ff44 <_SGiZvnmT95T+0x182b838>
102aa9644: 94659ad0    	bl	0x104410184 <_SGiZvnmT95T+0x182ba78>
102aa9648: 94659a88    	bl	0x104410068 <_SGiZvnmT95T+0x182b95c>
102aa964c: 94659b16    	bl	0x1044102a4 <_SGiZvnmT95T+0x182bb98>
102aa9650: 94659b5b    	bl	0x1044103bc <_SGiZvnmT95T+0x182bcb0>
102aa9654: 94659bb6    	bl	0x10441052c <_SGiZvnmT95T+0x182be20>
