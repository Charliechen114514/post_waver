---
title: "关于如何在Arch Linux上编写自己的第一个module"
date: 2024-07-27
---

# 关于如何在Arch Linux上编写自己的第一个module

​前一段时间一直想深入学习编写一个module插入到自己的内核当中，但是网上的资料基本上全都针对的[Ubuntu](https://so.csdn.net/so/search?q=Ubuntu&spm=1001.2101.3001.7020)和Debian等流行的Linux发行版，这里打算简单的记录一波博客。

### 啥是Module?(着急可不看)

​众所周知：现代宏内核架构的操作系统都会借鉴微内核当中比较有价值的设计思想，这里的modules正是"模块"的意思，模块模块，可载可拆。他的加载和卸载是动态的，我们并不需要重新编译内核，只需要使用insmod和rmmod指令，就可以加载或者卸载自己的module。

​模块的文件后缀是.ko文件，也是我们编程到最后生成的目标文件，挂载与卸载的就是.ko文件。（熟悉Linux内核编程的同志可以一眼认出这是kernel object的缩写）

### 正题：如何编写自己的kernel module

​模块的编写方式同一般的写法有些区别，作为对比，我们给出一个例子：

```text
// 我们编写基础的模块需要这三位兄第
#include <linux/module.h>
#include <linux/init.h>
#include <linux/moduleparam.h>
 
// 模块谁写的？
MODULE_AUTHOR("Charliechen");
// 模块的认证签名协议是？
MODULE_LICENSE("GPL");
 
// 下面开始是程序的正文。有同志会好奇干嘛是static呢？原因很简单：
// 模块的加载是独立的，作为下面即将使用的加载模块和卸载模块的函数，我们只会在
// 自己的文件中使用，因此！加上static，告知gcc不需要跑去找声明
static int prt_times = 10;
 
static int __init Charliechen_init(void){
    for(int i = 0; i < prt_times; i++)
        printk("SUP, DUDE!");
    return 0;
}
 
static void __exit Charliechen_exit(void){
    printk("GOODBYE_BOY");
}
 
module_init(Charliechen_init);
module_exit(Charliechen_exit);
 
```

​你会很懵，这个结构跟我们所熟悉的模块编程完全不一样！多了很多陌生的东西。如果你现在只是想快速的跳到结果，可以前往下一个小节了。

```text
static int __init Charliechen_init(void){
    for(int i = 0; i < prt_times; i++)
        printk("SUP, DUDE!");
    return 0;
}
 
// ... omitted ...
 
module_init(Charliechen_init);
```

​首先是模块的初始化函数，当我们的模块加载程序运行的时候，他会调用我们被标注以：module_init包裹的函数，这个函数将会作为我们对模块的初始化的函数，借用一下面对对象编程的术语，那就是构造函数！

​很简单这个函数做的事情：无非就是向内核打印"Sup, Dude"10次，很简单是吧。那么，这个**init做什么事情呢？学过内核编程的都知道这是标记符号：在这里，gcc扫描到**init这个东西，就会把这个函数放到特别安排的区域，同理，\_\_exit也是！好了，我们最后使用module_init或者是module_exit函数（咱们是动态加载）声明我们的"构造"函数和"析构函数"就好。

### 撸Makefile

​是的，我们生成模块要使用Makefile去写，先给出Makefile

```yaml
# 最后生成的模块名称的模块重定位文件
#（实际上就是说自己.ko的前面是啥,这里需要跟源文件名称一致）
obj-m:= charlie.o 
pwd:= $(shell pwd) # 当前目录
KDIR:= /lib/modules/($shell uname -r)/build # 我们的Kernel modules依赖文件在哪里
 
# make执行的：
all:
        make -C $(KDIR) M=$(pwd) modules
 
# make clean执行的
clean:
        rm -rf *.o .* .cmd *.ko *.mod.c .tmp_versions *.order *.symvers *.mod
```

​有同志马上就会发现自己没有/lib/modules/(uname -r)/build这个文件夹，这个需要单独下载：yay -Ss linux-headers，确认包的名称跟自己的linux-header一致后，下载下来，你就会发现多了一个build文件夹，里面就是我们开发modules的SDK了！

​我们下面make

```text
➜  make
make -C /lib/modules/6.9.3-arch1-1//build M=/home/Charliechen/Works/opearte_system/module modules
make[1]: 进入目录“/usr/lib/modules/6.9.3-arch1-1/build”
  CC [M]  /home/Charliechen/Works/opearte_system/module/charlie.o
  MODPOST /home/Charliechen/Works/opearte_system/module/Module.symvers
  CC [M]  /home/Charliechen/Works/opearte_system/module/charlie.mod.o
  LD [M]  /home/Charliechen/Works/opearte_system/module/charlie.ko
  BTF [M] /home/Charliechen/Works/opearte_system/module/charlie.ko
```

​好了，我们拿到了自己的module了，下面讲解如何挂载，查看信息，卸载。

### 挂载我们的module

​挂载模块很简单：

```bash
sudo insmod 模块名.ko
```

​我先前踩过这个坑：

```yaml
ERROR: Can not load xxx.ko: Invalid Format
```

​排查一下，会告知你很具体的原因，办法是：

```text
dmesg | tail -2
```

​最常见的原因是模块的系统版本签名和自己将要挂载的系统的版本不对等，arch兄弟们可以reboot(大概率是自己update系统之后不reboot导致自己使用的SDK版本和系统不对等)，重启后保证自己的uname -r跟自己的模块系统版本签名一致就行

​正常的现象是：啥也没有

![image-20240727165342067](/img/articles/2024-07-27-关于如何在Arch-Linux上编写自己的第一个module/image-20240727165342067.png)

​现在，我们来看看自己的模块挂没挂上

```text
[    6.058570] loop: module loaded
[  156.245140] charlie: loading out-of-tree module taints kernel.
[  156.245148] charlie: module verification failed: signature and/or required key missing - tainting kernel 
不用害怕最后一行，这是我们没有验证模块，不影响什么
```

​printk函数是内核打印函数，系统的日志就是依靠这个函数完成的，我们观察我们的模块现象：

```text
[  156.245140] charlie: loading out-of-tree module taints kernel.
[  156.245148] charlie: module verification failed: signature and/or required key missing - tainting kernel
[  156.245609] SUP, DUDE!
[  156.245611] SUP, DUDE!
[  156.245611] SUP, DUDE!
[  156.245612] SUP, DUDE!
[  156.245612] SUP, DUDE!
[  156.245613] SUP, DUDE!
[  156.245613] SUP, DUDE!
[  156.245614] SUP, DUDE!
[  156.245614] SUP, DUDE!
```

​符合我们的预期：向内核打印！（吞了一个输出，无伤大雅）

### 查看我们module信息

​查看的办法是

```text
modinfo xxx.ko
```

```yaml
➜  modinfo charlie.ko
filename:       /home/Charliechen/Works/opearte_system/module/charlie.ko
license:        GPL
author:         Charliechen
srcversion:     D2FFFA830F5695951FAAC09
depends:        
retpoline:      Y
name:           charlie
vermagic:       6.9.3-arch1-1 SMP preempt mod_unload 
```

### 卸载我们的module

```bash
sudo rmmod xxx.ko 
[  952.395595] GOODBYE_BOY
```
