
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ae03ac: d10083ff    	sub	sp, sp, #0x20
102ae03b0: a90167fa    	stp	x26, x25, [sp, #0x10]
102ae03b4: 52800fc9    	mov	w9, #0x7e               ; =126
102ae03b8: b9000be9    	str	w9, [sp, #0x8]
102ae03bc: 910033e9    	add	x9, sp, #0xc
102ae03c0: 910023ea    	add	x10, sp, #0x8
102ae03c4: 10000027    	adr	x7, 0x102ae03c8 <_CMa03SUie28mjv+0x7af90>
102ae03c8: 9800015a    	ldrsw	x26, 0x102ae03f0 <_CMa03SUie28mjv+0x7afb8>
102ae03cc: aa3a03fa    	mvn	x26, x26
102ae03d0: aa3a03fa    	mvn	x26, x26
102ae03d4: 9102bb5a    	add	x26, x26, #0xae
102ae03d8: b9800145    	ldrsw	x5, [x10]
102ae03dc: 8b05035a    	add	x26, x26, x5
102ae03e0: 8b1a00e7    	add	x7, x7, x26
102ae03e4: 528000f0    	mov	w16, #0x7               ; =7
102ae03e8: b9000130    	str	w16, [x9]
102ae03ec: d61f00e0    	br	x7
102ae03f0: ffffff10    	<unknown>
102ae03f4: ba73439a    	<unknown>
102ae03f8: 219d051f    	<unknown>
102ae03fc: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102ae0400: ff7fbd2c    	<unknown>
102ae0404: 7100041f    	cmp	w0, #0x1
102ae0408: 5400030b    	b.lt	0x102ae0468 <_CMa03SUie28mjv+0x7b030>
102ae040c: aa0203e8    	mov	x8, x2
102ae0410: aa0103e4    	mov	x4, x1
102ae0414: 5282eb29    	mov	w9, #0x1759             ; =5977
102ae0418: 72ba36e9    	movk	w9, #0xd1b7, lsl #16
102ae041c: 9ba97c09    	umull	x9, w0, w9
102ae0420: d36dfd29    	lsr	x9, x9, #45
102ae0424: 1284e1ea    	mov	w10, #-0x2710           ; =-10000
102ae0428: 1b0a012a    	madd	w10, w9, w10, w0
102ae042c: 12003d4a    	and	w10, w10, #0xffff
102ae0430: 5290a3eb    	mov	w11, #0x851f            ; =34079
102ae0434: 72aa3d6b    	movk	w11, #0x51eb, lsl #16
102ae0438: 9bab7d4a    	umull	x10, w10, w11
102ae043c: d365fd41    	lsr	x1, x10, #37
102ae0440: 9bab7c0a    	umull	x10, w0, w11
102ae0444: d365fd4a    	lsr	x10, x10, #37
102ae0448: 52800c8b    	mov	w11, #0x64              ; =100
102ae044c: 1b0b8142    	msub	w2, w10, w11, w0
102ae0450: aa0903e0    	mov	x0, x9
102ae0454: 52800023    	mov	w3, #0x1                ; =1
102ae0458: aa0803e5    	mov	x5, x8
102ae045c: a94167fa    	ldp	x26, x25, [sp, #0x10]
102ae0460: 910083ff    	add	sp, sp, #0x20
102ae0464: 17ff24b6    	b	0x102aa973c <_CMa03SUie28mjv+0x44304>
102ae0468: d2800000    	mov	x0, #0x0                ; =0
102ae046c: a94167fa    	ldp	x26, x25, [sp, #0x10]
102ae0470: 910083ff    	add	sp, sp, #0x20
102ae0474: d65f03c0    	ret
