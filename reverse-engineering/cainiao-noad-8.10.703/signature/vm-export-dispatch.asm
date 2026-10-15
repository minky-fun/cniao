
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a51458 <_uP0zKbWVU9>:
102a518ec: b40001e0    	cbz	x0, 0x102a51928 <_uP0zKbWVU9+0x4d0>
102a518f0: f9400008    	ldr	x8, [x0]
102a518f4: b40001a8    	cbz	x8, 0x102a51928 <_uP0zKbWVU9+0x4d0>
102a518f8: b9401909    	ldr	w9, [x8, #0x18]
102a518fc: 7100053f    	cmp	w9, #0x1
102a51900: 54000180    	b.eq	0x102a51930 <_uP0zKbWVU9+0x4d8>
102a51904: 35000189    	cbnz	w9, 0x102a51934 <_uP0zKbWVU9+0x4dc>
102a51908: f9400108    	ldr	x8, [x8]
102a5190c: b40000e8    	cbz	x8, 0x102a51928 <_uP0zKbWVU9+0x4d0>
102a51910: b9412109    	ldr	w9, [x8, #0x120]
102a51914: 6b01013f    	cmp	w9, w1
102a51918: 54000089    	b.ls	0x102a51928 <_uP0zKbWVU9+0x4d0>
102a5191c: f9408d08    	ldr	x8, [x8, #0x118]
102a51920: b8615901    	ldr	w1, [x8, w1, uxtw #2]
102a51924: 14002d66    	b	0x102a5cebc <_uP0zKbWVU9+0xba64>
102a51928: 528000e0    	mov	w0, #0x7                ; =7
102a5192c: d65f03c0    	ret
102a51930: 1400028a    	b	0x102a52358 <_uP0zKbWVU9+0xf00>
102a51934: 528007c0    	mov	w0, #0x3e               ; =62
102a51938: d65f03c0    	ret
