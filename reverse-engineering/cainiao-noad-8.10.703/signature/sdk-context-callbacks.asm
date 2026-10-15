
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a714e0: b4000060    	cbz	x0, 0x102a714ec <_CMa03SUie28mjv+0xc0b4>
102a714e4: b9400008    	ldr	w8, [x0]
102a714e8: 12000100    	and	w0, w8, #0x1
102a714ec: d65f03c0    	ret
102a714f0: b4000060    	cbz	x0, 0x102a714fc <_CMa03SUie28mjv+0xc0c4>
102a714f4: b9400008    	ldr	w8, [x0]
102a714f8: 53010500    	ubfx	w0, w8, #1, #1
102a714fc: d65f03c0    	ret
102a71500: b4000060    	cbz	x0, 0x102a7150c <_CMa03SUie28mjv+0xc0d4>
102a71504: b9400008    	ldr	w8, [x0]
102a71508: 53020900    	ubfx	w0, w8, #2, #1
102a7150c: d65f03c0    	ret
102a71510: b4000060    	cbz	x0, 0x102a7151c <_CMa03SUie28mjv+0xc0e4>
102a71514: b9400008    	ldr	w8, [x0]
102a71518: 53030d00    	ubfx	w0, w8, #3, #1
102a7151c: d65f03c0    	ret
102a71520: b4000060    	cbz	x0, 0x102a7152c <_CMa03SUie28mjv+0xc0f4>
102a71524: b9400008    	ldr	w8, [x0]
102a71528: 53041100    	ubfx	w0, w8, #4, #1
102a7152c: d65f03c0    	ret

Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a71530: b40000a0    	cbz	x0, 0x102a71544 <_CMa03SUie28mjv+0xc10c>
102a71534: f9400800    	ldr	x0, [x0, #0x10]
102a71538: b4000060    	cbz	x0, 0x102a71544 <_CMa03SUie28mjv+0xc10c>
102a7153c: 52800021    	mov	w1, #0x1                ; =1
102a71540: 14020032    	b	0x102af1608 <_CMa03SUie28mjv+0x8c1d0>
102a71544: d2800000    	mov	x0, #0x0                ; =0
102a71548: d65f03c0    	ret
102a7154c: b40000a0    	cbz	x0, 0x102a71560 <_CMa03SUie28mjv+0xc128>
102a71550: f9400c00    	ldr	x0, [x0, #0x18]
102a71554: b4000060    	cbz	x0, 0x102a71560 <_CMa03SUie28mjv+0xc128>
102a71558: 52800021    	mov	w1, #0x1                ; =1
102a7155c: 1402002b    	b	0x102af1608 <_CMa03SUie28mjv+0x8c1d0>
102a71560: d2800000    	mov	x0, #0x0                ; =0
102a71564: d65f03c0    	ret
102a71568: b40000a0    	cbz	x0, 0x102a7157c <_CMa03SUie28mjv+0xc144>
102a7156c: f9401000    	ldr	x0, [x0, #0x20]
102a71570: b4000060    	cbz	x0, 0x102a7157c <_CMa03SUie28mjv+0xc144>
102a71574: 52800021    	mov	w1, #0x1                ; =1
102a71578: 14020024    	b	0x102af1608 <_CMa03SUie28mjv+0x8c1d0>
102a7157c: d2800000    	mov	x0, #0x0                ; =0
102a71580: d65f03c0    	ret
102a71584: b40000a0    	cbz	x0, 0x102a71598 <_CMa03SUie28mjv+0xc160>
102a71588: f9401400    	ldr	x0, [x0, #0x28]
102a7158c: b4000060    	cbz	x0, 0x102a71598 <_CMa03SUie28mjv+0xc160>
102a71590: 52800021    	mov	w1, #0x1                ; =1
102a71594: 1402001d    	b	0x102af1608 <_CMa03SUie28mjv+0x8c1d0>
102a71598: d2800000    	mov	x0, #0x0                ; =0
102a7159c: d65f03c0    	ret
102a715a0: b40000a0    	cbz	x0, 0x102a715b4 <_CMa03SUie28mjv+0xc17c>
102a715a4: f9401800    	ldr	x0, [x0, #0x30]
102a715a8: b4000060    	cbz	x0, 0x102a715b4 <_CMa03SUie28mjv+0xc17c>
102a715ac: 52800021    	mov	w1, #0x1                ; =1
102a715b0: 14020016    	b	0x102af1608 <_CMa03SUie28mjv+0x8c1d0>
102a715b4: d2800000    	mov	x0, #0x0                ; =0
102a715b8: d65f03c0    	ret


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aed18c: d10083ff    	sub	sp, sp, #0x20
102aed190: a9016ffc    	stp	x28, x27, [sp, #0x10]
102aed194: 528009e8    	mov	w8, #0x4f               ; =79
102aed198: b9000be8    	str	w8, [sp, #0x8]
102aed19c: 910033e8    	add	x8, sp, #0xc
102aed1a0: 910023e9    	add	x9, sp, #0x8
102aed1a4: 1000002e    	adr	x14, 0x102aed1a8 <_CMa03SUie28mjv+0x87d70>
102aed1a8: 980000fb    	ldrsw	x27, 0x102aed1c4 <_CMa03SUie28mjv+0x87d8c>
102aed1ac: b980012d    	ldrsw	x13, [x9]
102aed1b0: 8b0d037b    	add	x27, x27, x13
102aed1b4: 8b1b01ce    	add	x14, x14, x27
102aed1b8: 52800e51    	mov	w17, #0x72              ; =114
102aed1bc: b9000111    	str	w17, [x8]
102aed1c0: d61f01c0    	br	x14
102aed1c4: ffffffe1    	<unknown>
102aed1c8: a8a08dca    	stp	x10, x3, [x14], #-0x1f8
102aed1cc: d40076c2    	hvc	#0x3b6
102aed1d0: a422ebce    	ld2b	{ z14.b, z15.b }, p2/z, [x30, #0x4, mul vl]
102aed1d4: 32cc1ee5    	<unknown>
102aed1d8: 9001f068    	adrp	x8, 0x1068f9000 <dyld_stub_binder+0x1068f9000>
102aed1dc: 397a9500    	ldrb	w0, [x8, #0xea5]
102aed1e0: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102aed1e4: 910083ff    	add	sp, sp, #0x20
102aed1e8: d65f03c0    	ret


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aec064: 52800020    	mov	w0, #0x1                ; =1
102aec068: 52800021    	mov	w1, #0x1                ; =1
102aec06c: 52800062    	mov	w2, #0x3                ; =3
102aec070: 52800003    	mov	w3, #0x0                ; =0
102aec074: 100088c4    	adr	x4, 0x102aed18c <_CMa03SUie28mjv+0x87d54>
102aec078: d503201f    	nop
102aec07c: d63f0100    	blr	x8


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ae0bdc: 10e03104    	adr	x4, 0x102aa11fc <_CMa03SUie28mjv+0x3bdc4>
102ae0be0: d503201f    	nop
102ae0be4: 52800020    	mov	w0, #0x1                ; =1
102ae0be8: 528004a1    	mov	w1, #0x25               ; =37
102ae0bec: 52800022    	mov	w2, #0x1                ; =1
102ae0bf0: 52800023    	mov	w3, #0x1                ; =1
102ae0bf4: d63f0100    	blr	x8


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa17f4: b0016560    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102aa17f8: 91246000    	add	x0, x0, #0x918
102aa17fc: 946632bf    	bl	0x10442e2f8 <dyld_stub_binder+0x10442e2f8>
102aa1800: aa0003f4    	mov	x20, x0
102aa1804: b0016560    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102aa1808: 9125e000    	add	x0, x0, #0x978
102aa180c: 946632dc    	bl	0x10442e37c <dyld_stub_binder+0x10442e37c>
102aa1810: aa0003f3    	mov	x19, x0
102aa1814: b001bd08    	adrp	x8, 0x106242000 <dyld_stub_binder+0x106242000>
102aa1818: f9445901    	ldr	x1, [x8, #0x8b0]
102aa181c: aa1403e0    	mov	x0, x20
102aa1820: aa1303e2    	mov	x2, x19
102aa1824: 94664008    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102aa1828: 34000160    	cbz	w0, 0x102aa1854 <_CMa03SUie28mjv+0x3c41c>
102aa182c: 97fffd68    	bl	0x102aa0dcc <_CMa03SUie28mjv+0x3b994>
102aa1830: aa1d03fd    	mov	x29, x29
102aa1834: 9466402e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102aa1838: aa0003f4    	mov	x20, x0
102aa183c: aa1303e1    	mov	x1, x19
102aa1840: 94664001    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102aa1844: aa0003f3    	mov	x19, x0
102aa1848: aa1403e0    	mov	x0, x20
102aa184c: 94664019    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102aa1850: aa1303e0    	mov	x0, x19
102aa1854: a9437bfd    	ldp	x29, x30, [sp, #0x30]
102aa1858: a9424ff4    	ldp	x20, x19, [sp, #0x20]
102aa185c: a94167fa    	ldp	x26, x25, [sp, #0x10]
102aa1860: 910103ff    	add	sp, sp, #0x40
102aa1864: d65f03c0    	ret
