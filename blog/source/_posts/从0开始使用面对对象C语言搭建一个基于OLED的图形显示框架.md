---
title: "从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架"
date: 2025-01-30
---

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架

## 前言

​笔者前段时间花费了一周，整理了一下自从TM1637开始打算的，使用OLED来搭建一个通用的显示库的一个工程。笔者的OLED库已经开源到Github上了，地址在：[MCU_Libs/OLED at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED)

​框架目前的最终目的，是设计一个丝滑的带有动画和图标的动态多级菜单。笔者会尽可能详细的介绍自己的设计思路，供大家参考。

## 环境介绍

​首先，笔者惯用的是PlatformIO作为嵌入式开发的IDE，CubeMx作为方便的代码生成器辅助笔者进行快速的工作。各位可能更多使用的是CubeIDE或者是MDK5，关于这个，笔者会尽可能详细的阐述一些可能异于平台操作的操作。这里需要各位自行动手做更改！

## 代码与动机

​关于江科大的OLED代码和以KeysKing作为代码的优秀的嵌入式工程师的代码，笔者早就有所拜读，这些代码更多的是出于一种"可用的"而不是可复用的，代码风格上，笔者更青睐于KeysKing大佬的代码风格。但是笔者在移植的时候出现了一些困扰，导致最终失败。笔者随后决定基于KeysKing的思路，使用江科大的代码作为参考，使用Linux设备代码抽象的架构与面对对象C重新设计一套完整的OLED框架，全面的支持软硬件IIC和软硬件SPI。支持参数不同，大小不同的OLED作为显示。这也是笔者的一次大型的C语言工程训练。新手上路，多多包涵！

​如果你并不关心如何实现的，只是想快速实现如何使用，请到[MCU_Libs/OLED/library at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library)中直接拷贝两份代码，将所有代码添加进入你的工程（如果您有确定的OLED协议，请自行适当裁剪，笔者的代码极低耦合，可以直接删除不需要的代码）

​如果你关心的是如何实现的，这就是笔者写这个系列博客的目的。

## 架构设计，优缺点

​简单的讲，分为协议层（使用何种协议进行通信？），设备层（这个设备可以做什么？），图像层（可以使用设备绘制哪一些图像？），组件层（可以使用图像绘制哪一些组件？），层层递进，保证互相之间互不干扰。

​优点我说了，低耦合高内聚，笔者添加支持SSD1309的代码，从头到尾只是修改了两行代码 + 添加一行修正（`X += 2`），跑起来了整个框架。其他的代码笔者丝毫未动。

​缺点就是老生常谈的效率问题。整个事情需要良好的抽象。尽可能大的变量复用，确保敏感部分的函数跳转尽可能少，对OLED的特性尽可能熟悉，对自己的要求很高。

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架(协议层封装)

​关于架构设计概述等内容，笔者放到了：[https://blog.csdn.net/charlie114514191/article/details/145397231](https://blog.csdn.net/charlie114514191/article/details/145397231)

## 协议层设计，以IIC为例子

​我们先按照最经典的软硬件IIC为例子！笔者大部分接触到的都是4针脚的使用IIC协议通信的OLED片子。所以，笔者打算优先的搭建起来IIC部分的代码。所有完整的代码放到了：[MCU_Libs/OLED/library/OLED/Driver at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/OLED/Driver)，这个文件夹内部都是协议层的代码。

## 关于软硬件IIC

​软硬件IIC都是完成IIC通信协议的东西。但区别在于，我们到底是使用自己手动模拟的IIC还是使用专门硬件特化的IIC。

​关于IIC，看到这里的朋友都很熟悉了：IIC（Inter-Integrated Circuit）是一种常用的串行通信总线协议，用于微控制器与传感器、显示模块等外设之间的通信。而我们的软件IIC就是使用GPIO来模拟IIC时序。

> 优点：
>
> 1.  灵活性强，可以使用任意引脚进行通信，不受特定硬件限制。
> 2.  适用于不具备硬件IIC模块的微控制器。
> 3.  可以方便地调节时序，兼容性较好。
>
> 缺点：
>
> 1.  通信效率较低，占用CPU资源较多。
> 2.  对实时性要求高的应用不太适合。
> 3.  稳定性较差，容易受程序时序影响。

​硬件IIC则是将IIC应答处理委托给了专门的硬件。

> 优点
>
> 1.  通信速度快，效率高，因为由专用硬件处理时序。
> 2.  占用CPU资源少，适合需要高实时性的场合。
> 3.  通信稳定可靠，不易受到程序时序干扰。
>
> 缺点：
>
> 1.  只能使用特定的IIC引脚，不够灵活。
> 2.  不同微控制器之间的硬件IIC兼容性可能存在差异。
> 3.  部分微控制器可能没有硬件IIC模块，导致无法使用硬IIC。

​我们大概清楚了。代码上的实现就不会复杂。下面我们就可以开始聊一聊设计了。

## 设计的一些原则

​你认为这样的代码好看吗？

```text
void OLED_ShowImage(int16_t X, int16_t Y, uint8_t Width, uint8_t Height, const uint8_t *Image)
{
    uint8_t i = 0, j = 0;
    int16_t Page, Shift;
     
    /*将图像所在区域清空*/
    OLED_ClearArea(X, Y, Width, Height);
     
    /*遍历指定图像涉及的相关页*/
    /*(Height - 1) / 8 + 1的目的是Height / 8并向上取整*/
    for (j = 0; j < (Height - 1) / 8 + 1; j ++)
    {
        /*遍历指定图像涉及的相关列*/
        for (i = 0; i < Width; i ++)
        {
            if (X + i >= 0 && X + i <= 127)       //超出屏幕的内容不显示
            {
                /*负数坐标在计算页地址和移位时需要加一个偏移*/
                Page = Y / 8;
                Shift = Y % 8;
                if (Y < 0)
                {
                    Page -= 1;
                    Shift += 8;
                }
                 
                if (Page + j >= 0 && Page + j <= 7)       //超出屏幕的内容不显示
                {
                    /*显示图像在当前页的内容*/
                    OLED_DisplayBuf[Page + j][X + i] |= Image[j * Width + i] << (Shift);
                }
                 
                if (Page + j + 1 >= 0 && Page + j + 1 <= 7)       //超出屏幕的内容不显示
                {                   
                    /*显示图像在下一页的内容*/
                    OLED_DisplayBuf[Page + j + 1][X + i] |= Image[j * Width + i] >> (8 - Shift);
                }
            }
        }
    }
}
```

​好吧，好像大部分人的代码都是这样的。

​那这样呢？

```text
void CCGraphicWidget_draw_image(
    CCDeviceHandler*    handler,
    CCGraphic_Image*    image)
{
    if(!image->sources_register) return;
    handler->operations.draw_area_device_function(
        handler, image->point.x, image->point.y,
        image->image_size.width, image->image_size.height, image->sources_register
    );
}
```

​你需要在乎image是如何实现的吗？你需要知道如何完成OLED图像的显示是如何做的吗？

​你不需要！

​这段代码无非就是告诉了你一件事情：提供一个设备句柄作为"告知一个设备，在上面绘制"，告知一个"图像"你需要绘制，直接提供进来，由设备自己约定的方法绘制即可。怎么绘制的？你需要关心吗？你不需要。

​直到你需要考虑设备是如何工作的时候，你会看一眼内部的设备

```text
void oled_helper_draw_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, 
        uint16_t height, uint8_t* sources)
{
    // 嘿！超出绘制范围了
    if(x > POINT_X_MAX)  return;
    if(y > POINT_Y_MAX) return;

    // clear the area before being set
    // 先清理一下这个区域，不要干扰赋值
    oled_helper_clear_area(handle, x, y , width, height); 

    for(uint16_t j = 0; j < (height -1) / 8 + 1; j++)
    {
        for(uint16_t i = 0; i < width; i++)
        {
            if(x + i > OLED_WIDTH){break;}
            if(y / 8 + j > OLED_HEIGHT - 1){return;}

            OLED_GRAM[y / 8 + j][x + i] |= sources[j * width + i] << (y % 8);

            if(y / 8 + j + 1 > OLED_HEIGHT - 1){continue;}

            OLED_GRAM[y / 8 + j + 1][x + i] |= sources[j * width + i] >> (8 - y % 8);
        }
    }
}
```

​原来如此，是通过写OLED缓存赋值就可以把这个事情给搞明白的------但是当你不关心如何实现的时候，你并不需要付出心血代价把代码看懂然后------哦我的天，这个我压根不关心！当然，代价就是多支付若干次的函数调用（笑）

​这就是架构抽象带来的对开发的好处，但是只有这个不足以让我们使用复杂的抽象，我们一定还有别的好处，不是吗？让我们慢慢看吧！

## 完成协议层的抽象

​我已经说过，我们的OLED框架是由协议层（使用何种协议进行通信？），设备层（这个设备可以做什么？），图像层（可以使用设备绘制哪一些图像？），组件层（可以使用图像绘制哪一些组件？），层层递进，保证互相之间互不干扰。我们下面就着重的关心协议层。协议层需要完成的就是将委托的命令（OLED命令）和委托的数据（OLED数据）发送到设备上即可。

### 刨析我们的原理

​协议需要进行初始化，对于硬件，特别是HAL库，只需要咔咔调API就能把事情做完了。但是对于软件IIC，事情就需要麻烦一些，我们需要自己完成IIC时序的通信。

​让我们看看IIC的基本原理，基本上看，就是：通知起始通信，通知数据（他是命令还是数据并不关心）和通知停止。

1.  **起始条件（Start Condition）**\
    主设备将SDA从高电平拉低，同时保持SCL为高电平。当SDA从高到低时形成起始条件（START），通知从设备通信即将开始。
2.  **地址传输（Address Transmission）**\
    主设备发送一个7位或10位的从设备地址，紧接着是1位的读写方向标志位（R/W位）。
    -   R/W为0表示写操作，主设备发送数据
    -   R/W为1表示读操作，主设备接收数据\
        每发送一位数据时，SCL产生一个时钟脉冲（SCL上升沿锁存数据）。
3.  **应答信号（ACK/NACK）**\
    从设备在收到地址和R/W位后，如果能够正常接收数据，会在下一个时钟周期内将SDA拉低产生应答信号ACK（Acknowledge）。如果不响应，则保持SDA为高电平，产生非应答信号NACK（Not Acknowledge）。
4.  **数据传输（Data Transmission）**\
    主设备根据读写操作继续发送或接收数据，每次传输8位数据。
    -   写操作：主设备发送数据，从设备应答ACK
    -   读操作：从设备发送数据，主设备应答ACK\
        每个字节传输完成后，从设备需发送ACK信号以确认接收正常。
5.  **停止条件（Stop Condition）**\
    通信结束时，主设备将SDA从低电平拉高，同时保持SCL为高电平。当SDA从低到高时形成停止条件（STOP），表示通信结束。

​说了一大堆，其实就是：

1.  **起始条件：SDA高变低，SCL保持高**
2.  **数据传输：SDA根据数据位变化，SCL上升沿锁存数据**
3.  **应答信号：从设备将SDA拉低产生ACK，高电平为NACK**
4.  **停止条件：SDA低变高，SCL保持高**

​所以这样看来，无非就是使用两个引脚，按照上述规则进行高低电平的按照时序的拉高拉低。

​话里有话，我的意思就是：软件IIC需要知道你使用哪两个引脚进行通信，需要你来告知如何完成上面的协议约定控制设备。最终我们提供的，是像我们跟人聊天一般的：

> **嘿！我用软件IIC发送了一个Byte的命令/数据！**

​这是重点！也是我们协议层抽象的终点：完成委托给我们的数据传输的任务，其他的任何事情都与我们无关，也不在乎这个数据到底是啥！

### 如何完成我们的抽象

​**软件IIC需要知道你使用哪两个引脚进行通信，需要你来告知如何完成上面的协议约定控制设备！**我再强调的一次！

​所以，我们给一个被抽象为软件IIC的实体，提供一个配置，这个配置委婉的提醒了我们的IIC使用哪两个引脚进行通信。最终这个软件IIC实体将会提供可以完成"委托给我们的数据传输的任务"这个任务，需要注意的是，OLED发送数据需要区分他是命令还是数据。这样来看，我们最终就是提供两套方法：

```c
/* command send fucntion */
typedef void(*SendCommand)(void*, uint8_t);
/* data send fucntion */
typedef void(*SendData)(void*, uint8_t*, uint16_t);

/* driver level oled driver's functionalities */
typedef struct __OLED_Operations{
    SendCommand command_sender;
    SendData    data_sender;
}OLED_Operations;
```

​好像很是罕见！这是一个包装了函数指针的结构体。说的拗口，让我们引入面对对象的设计逻辑来再阐述上面的句子。

> 这是一个可以保证完成数据传输的OLED方法。调用这个方法，就可以保证我们完成了一个字节传递的命令，或者是完成一系列字节的数据传输

​又问我咋做的？先别管，你现在需要知道的是------我一调用！他就能干好这个事情！实现是下面的事情！它隶属于我们的协议实体的结构体，如下所示

```c
/* this will make the gpio used for iic */
typedef struct __OLED_SOFT_IIC_Private_Config
{
    /* soft gpio handling */ 
    OLED_IICGPIOPack       sda;
    OLED_IICGPIOPack       scl;
    uint32_t            accepted_time_delay;
    uint16_t            device_address;
    OLED_Operations     operation;
}OLED_SOFT_IIC_Private_Config;
```

> **`OLED_IICGPIOPack sda`**\
> 表示用于IIC的SDA（数据线）引脚配置。
>
> -   `OLED_IICGPIOPack` 应该是一个结构体或类型，定义了与GPIO相关的参数，比如引脚号、端口等。
> -   该成员用来指定IIC通信中用作SDA的具体引脚。
>
> **`OLED_IICGPIOPack scl`**\
> 表示用于IIC的SCL（时钟线）引脚配置。
>
> -   同样是 `OLED_IICGPIOPack` 类型，用来配置时钟信号线（SCL）的具体引脚。
> -   这个成员和 `sda` 一起决定了软IIC使用的GPIO引脚。
>
> **`uint32_t accepted_time_delay`**\
> 用于设置IIC时序中的时间延迟。
>
> -   因为软IIC需要软件控制时序，这个值可能表示每个时钟周期的延迟时间（以微秒或纳秒为单位）。
> -   调节这个值可以改变IIC的通信速度，从而适配不同的外设设备。
>
> **`uint16_t device_address`**\
> IIC从设备的地址。
>
> -   IIC通信中，每个从设备都有唯一的地址，用于主设备区分不同的从设备。
> -   这个值通常是7位或10位地址，需要根据设备规格书配置。
>
> **`OLED_Operations operation`**\
> 表示IIC通信的操作类型。
>
> -   `OLED_Operations`定义了常见的IIC操作，比如 `READ`（读操作）、`WRITE`（写操作）等。

​初始化的办法，这里就只需要按部就班的赋值。

```text
void oled_bind_softiic_handle(
    OLED_SOFT_IIC_Private_Config*   config,
    OLED_IICGPIOPack*                  sda,  
    OLED_IICGPIOPack*                  scl,
    uint16_t                        device_address,
    uint32_t                        accepted_time_delay
)
{
    config->accepted_time_delay = accepted_time_delay;
    config->device_address = device_address;
    config->sda = *sda;
    config->scl = *scl;
    config->operation.command_sender    = ?
    config->operation.data_sender       = ?
    /* we need to init the gpio type for communications */
}
```

​我们的函数写到下面就顿住了。对啊，咋发送啊？咋操作啊？这才是这个时候我们思考的问题：如何实现软件IIC呢？

​我们首先需要完成的是：初始化我们的引脚，让他们可以完成传递电平的任务。

```text
static void __pvt_on_init_iic_gpio(OLED_SOFT_IIC_Private_Config* config)
{
    /* Enable the GPIOB clock */
    /* 这就是把时钟打开了而已，是__HAL_RCC_GPIOB_CLK_ENABLE的一个等价替换 */
    /* 
        #define OLED_ENABLE_GPIO_SCL_CLK() __HAL_RCC_GPIOB_CLK_ENABLE()
        #define OLED_ENABLE_GPIO_SDA_CLK() __HAL_RCC_GPIOB_CLK_ENABLE()
    */
    // 为什么这样做。。。你换引脚了直接改上面的#define不香吗？集中起来处理一坨屎而不是让你的史满天飞到处改
    OLED_ENABLE_GPIO_SCL_CLK();
    OLED_ENABLE_GPIO_SDA_CLK();

    GPIO_InitTypeDef GPIO_InitStructure = {0};
    /* configuration */
    GPIO_InitStructure.Pin = config->sda.pin | config->scl.pin;
    GPIO_InitStructure.Mode = GPIO_MODE_OUTPUT_OD;         // 开漏模式
    GPIO_InitStructure.Pull = GPIO_NOPULL;                 // 不上拉也不下拉
    GPIO_InitStructure.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStructure);
    // 这个是一个非常方便的宏，是笔者自己封装的：
    /*
        #define SET_SCL(config, pinstate) \
        do{\
            HAL_GPIO_WritePin(config->scl.port, config->scl.pin, pinstate);\
        }while(0)

        #define SET_SDA(config, pinstate) \
        do{\
            HAL_GPIO_WritePin(config->sda.port, config->sda.pin, pinstate);\
        }while(0)
    */
    SET_SCL(config, 1);
    SET_SDA(config, 1);
}
```

### 插入几个C语言小技巧

> 1.  结构体的使用更加像是对一个物理实体的抽象，比如说我们的软件IIC实体由两个GPIO引脚，提供一个OLED地址和延迟时间组成，他可以发送命令和数据
>
>     ```
>     /* this will make the gpio used for iic */
>     typedef struct __OLED_SOFT_IIC_Private_Config
>     {
>         /* soft gpio handling */ 
>         OLED_IICGPIOPack       sda;
>         OLED_IICGPIOPack       scl;
>         uint32_t            accepted_time_delay;
>         uint16_t            device_address;
>         OLED_Operations     operation;
>     }OLED_SOFT_IIC_Private_Config;
>     ```
>
>     这样的抽象也就呼之欲出了
>
> 2.  为什么使用do while呢？答案是：符合大部分人的使用习惯。
>
>     **避免宏定义中的语法问题**\
>     在宏中使用 `do { } while(0);` 可以确保宏内容被当作一个独立的语句块执行。\
>     例如：
>
>     ```
>     #define MY_MACRO(x) do { if (x) func(); } while (0)  
>     ```
>
>     这样，即使在使用时加上分号也不会引发编译错误：
>
>     ```
>     if (condition)  
>         MY_MACRO(1);  // 正确处理，避免语法歧义  
>     else  
>         other_func();  
>     ```
>
>     如果直接使用 `` 而不加 `do-while(0)`，编译器可能会报错或者导致意外的逻辑问题。
>
>     **提升代码的可读性与可维护性**\
>     `do { } while(0);` 语法块明确限制了语句作用范围，避免宏或语句中的变量污染外部作用域，从而增强代码的封装性。
>
>     **兼容语法规则，减少隐患**\
>     `do { } while(0);` 总能确保语法结构合法，即使宏中包含复杂的控制语句也不会影响逻辑。
>
>     ```
>     #define SAFE_BLOCK do { statement1; statement2; } while(0)  
>     ```
>
>     这样即便加了分号也能正常执行，符合常规语句格式。
>
>     **避免空语句问题**\
>     使用 `do-while(0)` 可以有效避免空语句可能带来的逻辑漏洞。
>
>     你问我担心开销？拜托！编译器会自动优化！全给你消的一点不剩了，完全就是正常的调用，为啥不用？
>
> 3.  为什么在函数的起头带上static?
>
>     保证我们的函数在文件作用域是私有的，不会跟其他函数起冲突的。说白了，就是我说的：你需要在干别的事情还要担心一下自己的软件IIC是咋工作的吗？你不需要！担心是一个有病的行为。所以，他保证了接口是简洁的。

### 完成软件IIC通信

#### 开始我们的IIC通信

​软件IIC通信开始，需要先拉高SDA和SCL保证处于高电平，然后拽低SDA和SCL的电平

```text
static void __pvt_on_start_iic(OLED_SOFT_IIC_Private_Config* config) 
{
    SET_SDA(config, 1);
    SET_SCL(config, 1);
    SET_SDA(config, 0);
    SET_SCL(config, 0);    
}
```

#### 结束我们的IIC通信

​设置我们的SDA先低，之后让SDA和SCL都处于高电平结束战斗

```text
static void __pvt_on_stop_iic(OLED_SOFT_IIC_Private_Config* handle)
{
    SET_SDA(handle, 0);     
    SET_SCL(handle, 1);     
    SET_SDA(handle, 1);      
}
```

#### 发送一个字节

​发送一个目标字节给我们的设备，你不需要关心这个字节是什么，你不需要现在关心它！

```text
static void __pvt_iic_send_bytes(OLED_SOFT_IIC_Private_Config* handle, uint8_t data)
{  
    for (uint8_t i = 0; i < 8; i++)
    {  
        SET_SDA(handle,!!(data & (0x80 >> i)));
        SET_SCL(handle,1);  
        SET_SCL(handle,0);  
    }
    
    SET_SCL(handle,1);      
    SET_SCL(handle,0);
}
```

> `!!` 的作用是将任意数值转换为布尔值，保证我们发的就是0和1，`(0x80 >> i)`萃取了从高向低数的第I位数字发送，也就是往SDA电平上传递我们的data上的第I位。之后拉起释放SCL告知完成传递。

#### （重要）完成命令传递和数据传递

​我们现在开始想起来，我们最终的目的是：完成一个字节命令的传递或者是传递一系列的数据比特。结合手册，我们来看看实际上怎么做。

​按照顺序，依次传递

-   开启IIC通信
-   设备的地址
-   数据类型（是命令还是数据）
-   数据本身。
-   结束IIC通信

```text
/*
    #define DATA_PREFIX     (0x40)
    #define CMD_PREFIX      (0x00)
*/
static void __pvt_iic_send_command(void* pvt_handle, uint8_t cmd)
{
    OLED_SOFT_IIC_Private_Config* config = 
        (OLED_SOFT_IIC_Private_Config*)pvt_handle;

    __pvt_on_start_iic(config);
    __pvt_iic_send_bytes(config, config->device_address);
    __pvt_iic_send_bytes(config, CMD_PREFIX);
    __pvt_iic_send_bytes(config, cmd);
    __pvt_on_stop_iic(config);
}

static void __pvt_iic_send_data(
    void* pvt_handle, 
    uint8_t* data, uint16_t size)
{
    OLED_SOFT_IIC_Private_Config* config = 
        (OLED_SOFT_IIC_Private_Config*)pvt_handle;
    __pvt_on_start_iic(config);
    __pvt_iic_send_bytes(config, config->device_address);
    __pvt_iic_send_bytes(config, DATA_PREFIX);
    for(uint16_t i = 0; i < size; i++)
        __pvt_iic_send_bytes(config, data[i]);
    __pvt_on_stop_iic(config); 
}
```

#### 最终一击，完成我们的IIC通信

```yaml
/*
    config: 
        Pointer to an OLED_SOFT_IIC_Private_Config structure that 
        contains the configuration settings for the software I2C communication,
        such as timing, pins, and other relevant parameters.
        config should be blank or uninitialized.
    sda: 
        Pointer to an OLED_GPIOPack structure that 
        represents the GPIO configuration for the Serial Data (SDA) line of 
        the software I2C interface.

    scl: 
        Pointer to an OLED_GPIOPack structure that 
        represents the GPIO configuration for the Serial Clock (SCL) line of 
        the software I2C interface.

    device_address: 
        The 7-bit I2C address of the device that the software I2C 
        communication is targeting, typically used to identify the 
        device on the I2C bus.

    accepted_time_delay: 
        A timeout value in milliseconds, 
        specifying the maximum allowed delay for the software 
        I2C communication process.
*/
void oled_bind_softiic_handle(
    OLED_SOFT_IIC_Private_Config*   config,
    OLED_IICGPIOPack*                  sda,  
    OLED_IICGPIOPack*                  scl,
    uint16_t                        device_address,
    uint32_t                        accepted_time_delay
){
    config->accepted_time_delay = accepted_time_delay;
    config->device_address = device_address;
    config->sda = *sda;
    config->scl = *scl;
    config->operation.command_sender    = __pvt_iic_send_command;
    config->operation.data_sender       = __pvt_iic_send_data;
    __pvt_on_init_iic_gpio(config); 
}
```

​我们把方法和数据都传递给这个软件iic实体，现在，他就能完成一次软件IIC通信了。给各位看看如何使用

```text
config->operation.command_sender(config, oled_spi_init_command[i]);
```

​可以看到，我们的结构体函数指针就是这样使用的。

## 硬件IIC

​硬件IIC事情就会简单特别多，原因在于，我们有专门的硬件帮助我们完成IIC通信

```c
#ifndef OLED_HARD_IIC_H
#define OLED_HARD_IIC_H
#include "OLED/Driver/oled_config.h"
#include "stm32f1xx_hal.h"
#include "stm32f1xx_hal_i2c.h"

typedef struct __OLED_HARD_IIC_Private_Config{
    I2C_HandleTypeDef*  pvt_handle;
    uint32_t            accepted_time_delay;
    uint16_t            device_address;
    OLED_Operations     operation;
}OLED_HARD_IIC_Private_Config;

/* 
    handle binder, bind the raw data to the oled driver
    
    blank_config: Pointer to an OLED_HARD_IIC_Private_Config structure that 
        holds the configuration settings for the I2C communication, 
        typically initializing the OLED hardware interface.
    
    raw_handle: 
        Pointer to an I2C_HandleTypeDef structure, 
        representing the raw I2C peripheral handle used to 
        configure and manage I2C communication for the device.

    device_address: The 7-bit I2C address of the device to 
        which the communication is being established, 
        typically used for identifying the target device on the I2C bus.

    accepted_time_delay: A timeout value in milliseconds 
        that specifies the maximum allowable 
        delay for the I2C communication process.
*/
void bind_hardiic_handle(
    OLED_HARD_IIC_Private_Config* blank_config,
    I2C_HandleTypeDef* raw_handle,
    uint16_t    device_address,
    uint32_t    accepted_time_delay
);

#endif
```

​现在我们可以不需要两个引脚了，只需要客户端提供一个硬件IIC句柄就好。

```text
#include "OLED/Driver/hard_iic/hard_iic.h"

static void __pvt_hardiic_send_data(void* pvt_handle, uint8_t* data, uint16_t size)
{
    OLED_HARD_IIC_Private_Config* config = 
        (OLED_HARD_IIC_Private_Config*)pvt_handle;
    for (uint8_t i = 0; i < size; i ++)
    {
         HAL_I2C_Mem_Write(
            config->pvt_handle,
            config->device_address,
            DATA_PREFIX,
            I2C_MEMADD_SIZE_8BIT,
            &data[i], 1, config->accepted_time_delay);   //依次发送Data的每一个数据
    }
}

static void __pvt_hardiic_send_command(void* pvt_handle, uint8_t cmd)
{
    OLED_HARD_IIC_Private_Config* config = 
        (OLED_HARD_IIC_Private_Config*)pvt_handle;
    HAL_I2C_Mem_Write(
        config->pvt_handle, 
        config->device_address,
        CMD_PREFIX,
        I2C_MEMADD_SIZE_8BIT,
        &cmd,1,config->accepted_time_delay);
}

void bind_hardiic_handle(
    OLED_HARD_IIC_Private_Config* blank_config,
    I2C_HandleTypeDef* raw_handle,
    uint16_t    device_address,
    uint32_t    accepted_time_delay
)
{
    blank_config->accepted_time_delay = accepted_time_delay;
    blank_config->device_address = device_address;
    blank_config->pvt_handle = raw_handle;
    blank_config->operation.command_sender  = __pvt_hardiic_send_command;
    blank_config->operation.data_sender     = __pvt_hardiic_send_data;
}
```

​HAL_I2C_Mem_Write函数直接完成了我们的委托，注意的是，我们每一次的调用这个函数，内部都是重新开始一次IIC通信的，所以，发送数据的时候，只能一个字节一个字节的发送（因为每一次都要指定这个是数据还是命令）。这一点，SPI协议的OLED就要好很多！（内部的引脚高低就直接决定了整个是命令还是数据，不需要通过解析传递的数据本身！）

​这样，一个典型的基于软硬件IIC的协议层抽象就完成了。如果你着急测试的话，可以自己替换原本OLED的操作。

​我们下一篇，就是开始抽象OLED的设备层。

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架（OLED设备层驱动封装）

## OLED设备层驱动开发

​现在，我们终于来到了最难的设备层驱动开发。在这里，我们抽象出来了一个叫做OLED_Device的东西，我们终于可以关心的是一块OLED，他可以被打开，被设置，被关闭，可以绘制点，可以绘制面，可以清空，可以反色等等。（画画不是这个层次该干的事情，要知道，绘制一个图形需要**从这个设备可以被绘制开始，也就是他可以画点，画面开始**！）

​所以，离我在这篇总览中[https://blog.csdn.net/charlie114514191/article/details/145397231提到的绘制一个多级菜单还是有一些遥远的。饭一口口吃，事情一步步做，这急不得，一着急反而会把我们精心维护的抽象破坏掉。](https://blog.csdn.net/charlie114514191/article/details/145397231提到的绘制一个多级菜单还是有一些遥远的。饭一口口吃，事情一步步做，这急不得，一着急反而会把我们精心维护的抽象破坏掉。)

​代码在[MCU_Libs/OLED/library/OLED at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/OLED)，两个文件夹都有所涉及，所以本篇的代码量会非常巨大。请各位看官合理安排。

### 如何抽象一个OLED

​协议层上，我们抽象了一个IIC协议。现在在设备层上，我们将进一步抽象一个OLED。上面笔者提到了，一个OLED可以被开启，关闭，画点画面，反色等等操作，他能干！他如何干是我们马上要做的事情。现在，我们需要一个OLED句柄。这个OLED句柄代表了**背后使用的通信协议和它自身相关的属性信息**，而不必要外泄到其他模块上去。所以，封装一个这样的抽象变得很有必要。

​OLED的品种很多，分法也很多，笔者顺其自然，打算封装一个这样的结构体

```c
typedef struct __OLED_Handle_Type{
    /* driver types announced the way we explain the handle */
    OLED_Driver_Type        stored_handle_type;
    /* handle data types here */
    OLED_Handle_Private     private_handle;
}OLED_Handle;
```

​让我来解释一下：首先，我们的OLED品种很多，程序如何知道你的OLED如何被解释呢？stored_handle_type标识的类型来决定采取何种行动解释。。。什么呢？解释我们的private_handle。

```text
typedef enum {
    OLED_SOFT_IIC_DRIVER_TYPE,
    OLED_HARD_IIC_DRIVER_TYPE,
    OLED_SOFT_SPI_DRIVER_TYPE,
    OLED_HARD_SPI_DRIVER_TYPE
}OLED_Driver_Type;

/*  
    to abstract the private handle base 
    this is to isolate the dependencies of
    the real implementations
*/
typedef void* OLED_Handle_Private;
```

​也就是说，笔者按照采取的协议进行抽象，将OLED**本身的信息属性差异封装到文件内部去**，作为使用不同的片子，只需要使用编译宏编译不同的文件就好了。现在，OLED_Handle就是我们的OLED，拿到这个结构体，我们就掌握了整个OLED。所以，整个OLED结构体必然可以做到如下的事情

```c
#ifndef OLED_BASE_DRIVER_H
#define OLED_BASE_DRIVER_H

#include "oled_config.h"

typedef struct __OLED_Handle_Type{
    /* driver types announced the way we explain the handle */
    OLED_Driver_Type        stored_handle_type;
    /* handle data types here */
    OLED_Handle_Private     private_handle;
}OLED_Handle;

/*
    oled_init_hardiic_handle registers the hardiic commnications
handle: 
    Pointer to an OLED_Handle structure that represents the handle 
    for the OLED display, used for managing 
    and controlling the OLED device.
    programmers should pass a blank one!

config: 
    Pointer to an OLED_HARD_IIC_Private_Config structure 
    that contains the configuration settings 
    for initializing the hardware interface, 
    typically related to the I2C communication 
    parameters for the OLED display.
*/
// 按照硬件IIC进行初始化
void oled_init_hardiic_handle(
    OLED_Handle* handle, 
    OLED_HARD_IIC_Private_Config* config);

/*
    oled_init_hardiic_handle registers the hardiic commnications
handle: 
    Pointer to an OLED_Handle structure that represents the handle 
    for the OLED display, used for managing 
    and controlling the OLED device.
    programmers should pass a blank one!

config: 
    Pointer to an OLED_SOFT_IIC_Private_Config structure 
    that contains the configuration settings 
    for initializing the hardware interface, 
    typically related to the I2C communication 
    parameters for the OLED display.
*/
// 按照软件IIC进行初始化
void oled_init_softiic_handle(
    OLED_Handle* handle,
    OLED_SOFT_IIC_Private_Config* config
);

/* 可以清空 */
void oled_helper_clear_frame(OLED_Handle* handle);
void oled_helper_clear_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/* 需要刷新，这里采用了缓存机制 */
void oled_helper_update(OLED_Handle* handle);
void oled_helper_update_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/* 可以反色 */
void oled_helper_reverse(OLED_Handle* handle);
void oled_helper_reversearea(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/* 可以绘制 */
void oled_helper_setpixel(OLED_Handle* handle, uint16_t x, uint16_t y);
void oled_helper_draw_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, 
        uint16_t height, uint8_t* sources);

/* 自身的属性接口，是我们之后要用的 */
uint8_t     oled_support_rgb(OLED_Handle* handle);
uint16_t    oled_width(OLED_Handle* handle);
uint16_t    oled_height(OLED_Handle* handle);

#endif
```

​说完了接口，下面就是实现了。

### 完成OLED的功能

#### 初始化OLED

​整个事情我们终于开始翻开我们的OLED手册了。我们的OLED需要一定的初始化。让我们看看江科大代码是如何进行OLED的初始化。

```text
void OLED_Init(void)
{
    uint32_t i, j;
    
    for (i = 0; i < 1000; i++)          //上电延时
    {
        for (j = 0; j < 1000; j++);
    }
    
    OLED_I2C_Init();            //端口初始化
    
    OLED_WriteCommand(0xAE);    //关闭显示
    
    OLED_WriteCommand(0xD5);    //设置显示时钟分频比/振荡器频率
    OLED_WriteCommand(0x80);
    
    OLED_WriteCommand(0xA8);    //设置多路复用率
    OLED_WriteCommand(0x3F);
    
    OLED_WriteCommand(0xD3);    //设置显示偏移
    OLED_WriteCommand(0x00);
    
    OLED_WriteCommand(0x40);    //设置显示开始行
    
    OLED_WriteCommand(0xA1);    //设置左右方向，0xA1正常 0xA0左右反置
    
    OLED_WriteCommand(0xC8);    //设置上下方向，0xC8正常 0xC0上下反置
 
    OLED_WriteCommand(0xDA);    //设置COM引脚硬件配置
    OLED_WriteCommand(0x12);
    
    OLED_WriteCommand(0x81);    //设置对比度控制
    OLED_WriteCommand(0xCF);
 
    OLED_WriteCommand(0xD9);    //设置预充电周期
    OLED_WriteCommand(0xF1);
 
    OLED_WriteCommand(0xDB);    //设置VCOMH取消选择级别
    OLED_WriteCommand(0x30);
 
    OLED_WriteCommand(0xA4);    //设置整个显示打开/关闭
 
    OLED_WriteCommand(0xA6);    //设置正常/倒转显示
 
    OLED_WriteCommand(0x8D);    //设置充电泵
    OLED_WriteCommand(0x14);
 
    OLED_WriteCommand(0xAF);    //开启显示
        
    OLED_Clear();               //OLED清屏
}
```

​好长一大串，麻了，代码真的不好看。我们为什么不使用数组进行初始化呢？

```text
uint8_t oled_init_commands[] = {
    0xAE,  // Turn off OLED panel
    0xFD, 0x12,  // Set display clock divide ratio/oscillator frequency
    0xD5,  // Set display clock divide ratio
    0xA0,  // Set multiplex ratio
    0xA8,  // Set multiplex ratio (1 to 64)
    0x3F,  // 1/64 duty
    0xD3,  // Set display offset
    0x00,  // No offset
    0x40,  // Set start line address
    0xA1,  // Set SEG/Column mapping (0xA0 for reverse, 0xA1 for normal)
    0xC8,  // Set COM/Row scan direction (0xC0 for reverse, 0xC8 for normal)
    0xDA,  // Set COM pins hardware configuration
    0x12,  // COM pins configuration
    0x81,  // Set contrast control register
    0xBF,  // Set SEG output current brightness
    0xD9,  // Set pre-charge period
    0x25,  // Set pre-charge as 15 clocks & discharge as 1 clock
    0xDB,  // Set VCOMH
    0x34,  // Set VCOM deselect level
    0xA4,  // Disable entire display on
    0xA6,  // Disable inverse display on
    0xAF   // Turn on the display
};
#define CMD_TABLE_SZ ( (sizeof(oled_init_commands)) / sizeof(oled_init_commands[0]) )
```

​现在，我们只需要按部就班的按照顺序发送我们的指令。以hardiic的初始化为例子

```text
void oled_init_hardiic_handle(
    OLED_Handle* handle, 
    OLED_HARD_IIC_Private_Config* config)
{
    // 传递使用的协议句柄, 以及告知我们的句柄类型 
    handle->private_handle = config;
    handle->stored_handle_type = OLED_HARD_IIC_DRIVER_TYPE;
    // 按部就班的发送命令表
    for(uint8_t i = 0; i < CMD_TABLE_SZ; i++)
        // 这里我们协议的send_command就发力了, 现在我们完全不关心他是如何发送命令的
        config->operation.command_sender(config, oled_init_commands[i]);
    // 把frame清空掉
    oled_helper_clear_frame(handle);
    // 把我们的frame commit上去
    oled_helper_update(handle);
}
```

​这里我们还剩下最后两行代码没解释，为什么是oled_helper_clear_frame和update要分离开来呢？我们知道，频繁的刷新OLED屏幕非常占用我们的单片机内核，也不利于我们合并绘制操作。比如说，我想绘制两个圆，为什么不画完一起更新上去呢？比起来画一个点更新一下，这个操作显然更合理。所以，为了完成这样的技术，我们需要一个Buffer缓冲区。

```text
uint8_t OLED_GRAM[OLED_HEIGHT][OLED_WIDTH];
```

​他就承担了我们的缓存区。多大呢？这个事情跟OLED的种类有关系，一些OLED的大小是128 x 64，另一些是144 x 64，无论如何，我们需要根据chip的种类，来选择我们的OLED的大小，更加严肃的说，是OLED的属性和它的功能。

​所以，这就是为什么笔者在[MCU_Libs/OLED/library/OLED/Driver/oled_config.h at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/blob/main/OLED/library/OLED/Driver/oled_config.h)文件中，引入了这样的控制宏

```text
#ifndef SSD1306_H
#define SSD1306_H

/* hardware level defines */
#define PORT_SCL    GPIOB
#define PORT_SDA    GPIOB
#define PIN_SCL     GPIO_PIN_8
#define PIN_SDA     GPIO_PIN_9

#define OLED_ENABLE_GPIO_SCL_CLK() __HAL_RCC_GPIOB_CLK_ENABLE()
#define OLED_ENABLE_GPIO_SDA_CLK() __HAL_RCC_GPIOB_CLK_ENABLE()

#define OLED_WIDTH  (128)
#define OLED_HEIGHT (8)

#define POINT_X_MAX     (OLED_WIDTH)
#define POINT_Y_MAX     (OLED_HEIGHT * 8)

#endif
```

​这个文件是ssd1306.h，这个文件专门承载了关于SSD1306配置的一切。现在，我们将OLED的配置系统建立起来了，当我们的chip是SSD1306的时候，只需要定义SSD1306的宏

```text
#ifndef OLED_CONFIG_H
#define OLED_CONFIG_H

...

/* oled chips selections */

#ifdef SSD1306

#include "configs/ssd1306.h"

#elif SSD1309
#include "configs/ssd1309.h"
#else
#error "Unknown chips, please select in compile time using define!"
#endif

#endif
```

​现在，我们的configure就完整了，我们只需要依赖config文件就能知道OLED自身的全部信息。如果你有IDE，现在就可以看到，当我们定义了SSD1306的时候，我们的OLED_GRAM自动调整为`OLED_GRAM[8][128]`的数组，另一放面，如果我们使用了SSD1309，我们自动会更新为`OLED_GRAM[8][144]`,此事在ssd1309.h中亦有记载

#### 清空屏幕

​显然，我们有一些人对C库并不太了解，memset函数负责将一块内存设置为给定的值。一般而言，编译器实现将会使用独有的硬件加速优化，使用上，绝对比手动设置值只快不慢。

> 软件工程的一大原则：复用！能不自己手搓就不自己手搓，编译器提供了就优先使用编译器提供的

```text
void oled_helper_clear_frame(OLED_Handle* handle)
{
    memset(OLED_GRAM, 0, sizeof(OLED_GRAM));
}
```

#### 刷新屏幕与光标设置1

​设置涂写光标，就像我们使用Windows的绘图软件一样，鼠标在哪里，左键嗯下就从那里开始绘制，我们的set_cursor函数就是干设置鼠标在哪里的工作。查询手册，我们可以这样书写（笔者是直接参考了江科大的实现）

```text
/*
    set operating cursor
*/
void __pvt_oled_set_cursor(
    OLED_Handle* handle, 
    const uint8_t y,
    const uint8_t x)
{   
    const uint8_t new_x = x + 2;
    OLED_Operations op_table;
    __on_fetch_oled_table(handle, &op_table);
    op_table.command_sender(handle->private_handle, 0xB0 | y);
    op_table.command_sender(handle->private_handle,0x10 | ((new_x & 0xF0) >> 4));  //设置X位置高4位
    op_table.command_sender(handle->private_handle,0x00 | (new_x & 0x0F));           //设置X位置低4位
}
```

#### 刷新屏幕与光标设置2

​不对，这个代码没有看懂！其一原因是我没有给出\_\_on_fetch_oled_table是什么。

```yaml
static void __on_fetch_oled_table(
    const OLED_Handle* handle, 
    OLED_Operations* blank_operations)
{
    switch (handle->stored_handle_type)
    {
        case OLED_HARD_IIC_DRIVER_TYPE:
        {
            OLED_HARD_IIC_Private_Config* config = 
                (OLED_HARD_IIC_Private_Config*)(handle->private_handle);
            blank_operations->command_sender = config->operation.command_sender;
            blank_operations->data_sender = config->operation.data_sender;
        }break;
        case OLED_SOFT_IIC_DRIVER_TYPE:
        {
            OLED_SOFT_IIC_Private_Config* config = 
                (OLED_SOFT_IIC_Private_Config*)(handle->private_handle);
            blank_operations->command_sender = config->operation.command_sender;
            blank_operations->data_sender = config->operation.data_sender;
        }break;
        ... // ommited spi seletctions
        }break;
        default:
            break;
    }
}
```

​这是干什么呢？答案是：根据OLED的类型，选择我们的操作句柄。这是因为C语言没法自动识别void\*的原貌是如何的，我们必须将`C++`中的虚表选择手动的完成

> 题外话：接触过C++的朋友都知道继承这个操作，实际上，这里就是一种继承。无论是何种IIC操作，都是IIC操作。他都必须遵守可以发送字节的接口操作，现在的问题是：他到底是哪样的IIC？需要执行的是哪样IIC的操作呢？所以，\_\_on_fetch_oled_table就是把正确的操作函数根据OLED的类型给筛选出来。也就是C++中的虚表选择操作

```text
/*
    set operating cursor
*/
void __pvt_oled_set_cursor(
    OLED_Handle* handle, 
    const uint8_t y,
    const uint8_t x)
{   
    const uint8_t new_x = x + 2;
    OLED_Operations op_table;
    __on_fetch_oled_table(handle, &op_table);
    op_table.command_sender(handle->private_handle, 0xB0 | y);
    op_table.command_sender(handle->private_handle,0x10 | ((new_x & 0xF0) >> 4));  //设置X位置高4位
    op_table.command_sender(handle->private_handle,0x00 | (new_x & 0x0F));           //设置X位置低4位
}
```

​现在回到上面的代码，我们将正确的操作句柄选择出来之后，可以发送设置"鼠标"的指令了。

> 复习一下位操作的基本组成
>
> -   &是一种萃取操作，任何数&0就是0，&1则是本身，说明可以通过对应&1保留对应位，&0抹除对应位
> -   \|是一种赋值操作，任何数&1就是1，\|0是本身，所以\|可以起到对应位置1的操作。
>
> 所以，保留高4位只需要 & 0xF0（0b11110000），保留低四位只需要&0x0F就好了（0b00001111）

#### 刷新屏幕与光标设置3

​现在让我们看看刷新屏幕是怎么做的

```text
void oled_helper_update(OLED_Handle* handle)
{
    OLED_Operations op_table;
    __on_fetch_oled_table(handle, &op_table);
        
    for (uint8_t j = 0; j < OLED_HEIGHT; j ++)
    {
        /*设置光标位置为每一页的第一列*/
        __pvt_oled_set_cursor(handle, j, 0);
        /*连续写入128个数据，将显存数组的数据写入到OLED硬件*/
        // 有趣的是,这里笔者埋下了一个伏笔,我为什么没写OLED_WIDTH呢?尽管在SSD1306这样做是正确的
        // 但那也是偶然,笔者在移植SSD1309的时候就发现了这样的不一致性,导致OLED死机.
        // 笔者提示: OLED长宽和可绘制区域的大小不一致性
        op_table.data_sender(handle->private_handle, OLED_GRAM[j], 128);
    }
}
```

​刷新整个屏幕就是将鼠标设置到开头，然后直接向后面写入128个数据结束我们的事情，这比一个个写要快得多！

#### 绘制一个点

​实际上，就是将对应的数组的位置放上1就好了，这需要牵扯到的是OLED独特的显示方式。

​OLED自身分有页这个概念，一个页8个像素，由传递的比特控制。举个例子，我想显示的是第一个像素亮起来，就需要在一个字节的第一个比特置1余下置0，这就是为什么OLED_HEIGHT的大小不是64而是8，也就意味着setpixel函数不是简单的

```text
OLED[height][width] = val
```

​而实需要进行一个复杂的计算。我们分析一下，给定一个Y的值。它落在的页就是 Y / 8。比如说，Y为5的时候落在第0页的第六个比特上，Y为9的时候落在第一个页的第一个第二个比特上（注意我们的Y从0开始计算），我们设置的位置也就是：`OLED_GRAM[y / 8][x]`，设置的值就是Y给定的比特是`0x01 << (y % 8)`

```text
void oled_helper_setpixel(OLED_Handle* handle, uint16_t x, uint16_t y)
{
    // current unused
    (void)handle;
    if( 
        0 <= x && x <= POINT_X_MAX &&
        0 <= y && y <= POINT_Y_MAX
    )
        OLED_GRAM[y / 8][x] |= 0x01 << (y % 8);
}
```

> (void)T是一种常见的放置maybe_unused的写法，现代编译器支持`[[maybe_unused]]`的指示符，表达的是这个参数可能不被用到，编译器不需要为此警告我，这在复用中很常见，一些接口的参数可能不被使用，这样的可读性会比传递空更加的好读，为了遵循ISO C，笔者没有采取，保证任何编译器都可以正确的理解我们的意图。

#### 反色

​反色就很简单了。只需要异或即可，首先，当给定的比特是0的时候，我们异或1，得到的就是相异的比较，所以结果是1：即0变成了1。我们给定的比特是1的时候，我们还是异或1，得到了相同的结果，所以结果是0，即1变成了0，这样不就实现了一个像素的反转吗！

```text
void oled_helper_reverse(OLED_Handle* handle)
{
    for(uint8_t i = 0; i < OLED_HEIGHT; i++)
    {
        for(uint8_t j = 0; j < OLED_WIDTH; j++)
        {
            OLED_GRAM[i][j] ^= 0xFF;
        }
    }
}
```

> 能使用memset吗？为什么？所以memset是在什么情况下能使用呢？
>
> 我都这样问了，那显然不能，因为设置的值跟每一个字节的内存强相关，memset的值必须跟内存的值没有关系。

#### 区域化操作

​我们还有区域化操作没有实现。基本的步骤是

> 思考需要的参数：需要知道对
>
> -   哪个OLED：OLED_Handle\* handle,
> -   起头在哪里：uint16_t x, uint16_t y,
> -   长宽如何：uint16_t width, uint16_t height
> -   对于置位，则需要一个连续的数组进行置位，它的大小就是描述了区域矩形的大小

​我们先来看置位函数

##### 区域置位

```text
void oled_helper_draw_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, 
        uint16_t height, uint8_t* sources)
{
    // 确保绘制区域的起点坐标在有效范围内，如果超出最大显示坐标则直接返回
    if(x > POINT_X_MAX)  return;
    if(y > POINT_Y_MAX)  return;

    // 在设置图像前，先清空绘制区域
    oled_helper_clear_area(handle, x, y, width, height); 

    // 遍历绘制区域的高度，以8像素为单位划分区域
    for(uint16_t j = 0; j < (height - 1) / 8 + 1; j++)
    {
        for(uint16_t i = 0; i < width; i++)
        {
            // 如果绘制超出屏幕宽度，则跳出循环
            if(x + i > OLED_WIDTH) { break; }
            // 如果绘制超出屏幕高度，则直接返回
            if(y / 8 + j > OLED_HEIGHT - 1) { return; }

            // 将sources中的数据按位移方式写入OLED显存GRAM
            // 当前行显示，低8位数据左移与显存当前内容进行按位或
            OLED_GRAM[y / 8 + j][x + i] |= sources[j * width + i] << (y % 8);

            // 如果绘制数据跨页（8像素一页），处理下一页的数据写入
            if(y / 8 + j + 1 > OLED_HEIGHT - 1) { continue; }

            // 将高8位数据右移后写入下一页显存
            OLED_GRAM[y / 8 + j + 1][x + i] |= sources[j * width + i] >> (8 - y % 8);
        }
    }
}
```

```text
// 如果绘制超出屏幕宽度，则跳出循环
if(x + i > OLED_WIDTH) { break; }
// 如果绘制超出屏幕高度，则直接返回
if(y / 8 + j > OLED_HEIGHT - 1) { return; }

// 将sources中的数据按位移方式写入OLED显存GRAM
// 当前行显示，低8位数据左移与显存当前内容进行按位或
OLED_GRAM[y / 8 + j][x + i] |= sources[j * width + i] << (y % 8);

// 如果绘制数据跨页（8像素一页），处理下一页的数据写入
if(y / 8 + j + 1 > OLED_HEIGHT - 1) { continue; }

// 将高8位数据右移后写入下一页显存
OLED_GRAM[y / 8 + j + 1][x + i] |= sources[j * width + i] >> (8 - y % 8);
```

​我们正常来讲，传递的会是一个二维数组，C语言对于二维数组的处理是连续的。也就是说。对于一个被声明为`OLED[WIDTH][HEIGHT]`的数组，访问`OLED[i][j]`本质上等价于`OLED + i * WIDTH + j`，这个事情如果还是不能理解可以查照专门的博客进行学习。笔者默认在这里看我写的东西已经不会被这样基础的知识所困扰了。所以，我们的所作的就是将出于低页的内容拷贝到底页上

> `OLED_GRAM[y / 8 + j][x + i]`：这是显存二维数组的索引访问。
>
> -   `y / 8 + j` 计算出当前数据位于哪个页（OLED通常按8个像素一页分块存储），通过整除将 `y` 坐标映射到显存页。
> -   `x + i` 表示横向的列位置。
>
> `sources[j * width + i]`：这是源图像数据数组的索引访问。
>
> -   `j * width + i` 计算当前像素在 `sources` 数据中的位置偏移。
>
> `<< (y % 8)`：将当前像素数据向左移动 `(y % 8)` 位，以确保源数据对齐到目标位置。
>
> -   `y % 8` 获取绘制的起点在当前页中的垂直偏移。
>
> `|=`：按位或运算符，将偏移后的数据合并到 `OLED_GRAM` 中现有内容。
>
> 如果 `y = 5`，那么 `y % 8 = 5`，表示当前像素从第5位开始绘制。例如：
>
> -   如果 `sources[j * width + i]` 的值是 `0b11000000`，经过 `<< 5` 位移后变为 `0b00000110`，再与 `OLED_GRAM` 的原有数据合并，从而只影响目标位置上的两个像素。

​先试一下分析`OLED_GRAM[y / 8 + j + 1][x + i] |= sources[j * width + i] >> (8 - y % 8);`，笔者的分析如下

> 1.  `OLED_GRAM[y / 8 + j + 1][x + i]`：
>     -   这是下一页显存中的对应位置。
>     -   `y / 8 + j + 1` 表示当前绘制位置的下一页。
>     -   `x + i` 仍为当前列位置。
> 2.  `sources[j * width + i]`：
>     -   源图像数据中当前像素的数据。
>     -   `j * width + i` 计算出当前像素在源数据中的位置。
> 3.  `>> (8 - y % 8)`：
>     -   将数据右移 `(8 - y % 8)` 位，将超出当前页的高位部分对齐到下一页。
>     -   `8 - y % 8` 计算需要移入下一页的位数。
> 4.  `|=`：
>     -   按位或，将偏移后的数据合并到下一页显存中，以保留已有内容。
>
> 假设 `y = 5`，那么 `8 - y % 8 = 3`。如果 `sources[j * width + i]` 为 `0b10110000`，右移 3 位得到 `0b00010110`，这部分数据写入下一页显存。

##### 区域反色

```text
void oled_helper_reversearea(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    // 确认起点坐标是否超出有效范围
    if(x > POINT_X_MAX)  return;
    if(y > POINT_Y_MAX)  return;

    // 确保绘制区域不会超出最大范围，如果超出则调整宽度和高度
    if(x + width > POINT_X_MAX)     width = POINT_X_MAX - x;
    if(y + height > POINT_Y_MAX)    height = POINT_Y_MAX - y;

    // 遍历高度范围中的每个像素行
    for(uint8_t i = y; i < y + height; i++)
    {
        for(uint8_t j = x; j < x + width; j++)
        {
            // 反转显存GRAM中的指定像素位（按位异或）
            OLED_GRAM[i / 8][j] ^= (0x01 << (i % 8));
        }
    }
}
```

##### 区域更新

```text
void oled_helper_update_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    // 检查起点坐标是否超出有效范围
    if(x > POINT_X_MAX)  return;
    if(y > POINT_Y_MAX)  return;

    // 确认绘制区域不超出最大范围
    if(x + width > POINT_X_MAX)     width = POINT_X_MAX - x;
    if(y + height > POINT_Y_MAX)    height = POINT_Y_MAX - y;

    // 定义OLED操作表变量
    OLED_Operations op_table;
    // 获取对应的操作函数表
    __on_fetch_oled_table(handle, &op_table);

    // 遍历绘制区域中的每个页（8像素一页）
    for(uint8_t i = y / 8; i < (y + height - 1) / 8 + 1; i++)
    {
        // 设置光标到指定页及列的位置
        __pvt_oled_set_cursor(handle, i, x);
        // 从显存中读取指定页和列的数据，通过data_sender发送到OLED硬件
        op_table.data_sender(handle, &OLED_GRAM[i][x], width);        
    }
}
```

​也就是将光标对应到位置上刷新width个数据，完事！

#### 区域清空

```text
void oled_helper_clear_area(OLED_Handle* handle, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    // 检查起点坐标是否超出有效范围
    if(x > POINT_X_MAX)  return;
    if(y > POINT_Y_MAX)  return;

    // 确保绘制区域不超出最大范围
    if(x + width > POINT_X_MAX)     width = POINT_X_MAX - x;
    if(y + height > POINT_Y_MAX)    height = POINT_Y_MAX - y;

    // 遍历高度范围内的所有像素
    for(uint8_t i = y; i < y + height; i++)
    {
        for(uint8_t j = x; j < x + width; j++)
        {
            // 清除显存中的指定像素位（按位与非操作）
            OLED_GRAM[i / 8][j] &= ~(0x01 << (i % 8));
        }
    }
}
```

> 1.  `OLED_GRAM[i / 8][j]`：
>     -   访问显存缓冲区中指定位置的字节。
>     -   `i / 8` 确定当前像素所在的页，因为 OLED 每页存储 8 个垂直像素。
>     -   `j` 为水平方向的列位置。
> 2.  `0x01 << (i % 8)`：
>     -   生成一个掩码，将 `0x01` 左移 `(i % 8)` 位。
>     -   `i % 8` 计算出在当前页中的垂直位偏移。
> 3.  `~(0x01 << (i % 8))`：
>     -   对掩码取反，生成一个用于清零的掩码。例如，如果 `i % 8 == 2`，则 `0x01 << 2` 为 `0b00000100`，取反后得到 `0b11111011`。
> 4.  `&=`：
>     -   按位与运算，将显存当前位置对应的像素清零，而其他位保持不变。
>
> 假设 `i = 10`，`j = 5`：
>
> -   `i / 8 = 1` 表示访问第 2 页（页索引为 1）；
> -   `i % 8 = 2` 表示需要清除该页第 3 位的像素；
> -   `0x01 << 2 = 0b00000100`，取反得到 `0b11111011`；
> -   `OLED_GRAM[1][5] &= 0b11111011` 会将第 3 位清零，其余位保持不变。

### 测试我们的抽象

​现在，我们终于可以开始测试我们的抽象了。完成了既可以使用软件IIC，又可以使用硬件IIC进行通信的OLED抽象，我们当然迫不及待的想要测试一下我们的功能是否完善。笔者这里刹住车，耐下性子听几句话。

​首先，测试不是一番风顺的，我们按照我们的期望对着接口写出了功能代码，基本上不会一番风顺的得到自己想要的结果，往往需要我们进行调试，找到其中的问题，修正然后继续测试。

#### 整理一下，我们应该如何使用？

​首先回顾接口。我们需要指定一个协议按照我们期望的方式进行通信。在上一篇博客中，我们做完了协议层次的抽象，在这里，我们只需要老老实实的注册接口就好了。

> 指引：如果你忘记了我们上一篇博客在做什么的话，请参考[https://blog.csdn.net/charlie114514191/article/details/145397569!](https://blog.csdn.net/charlie114514191/article/details/145397569!)

​笔者建议，新建一个Test文件夹，书写一个文件叫:`oled_test_hard_iic.c`和`oled_test_soft_iic.c`测试我们的设备层和协议层是正确工作的。笔者这里以测试硬件IIC的代码为例子。

​新建一个CubeMX工程，只需要简单的配置一下IIC就好了（笔者选择的是Fast Mode，为了方便以后测试我们的组件刷新），之后，只需要

```text
#include "OLED/Driver/hard_iic/hard_iic.h"
#include "Test/OLED_TEST/oled_test.h"
#include "i2c.h"
/* configs should be in persist way */
OLED_HARD_IIC_Private_Config config;

void user_init_hard_iic_oled_handle(OLED_Handle* handle)
{
    bind_hardiic_handle(&config, &hi2c1, 0x78, HAL_MAX_DELAY);
    oled_init_hardiic_handle(handle, &config);
}
```

​`bind_hardiic_handle`注册了使用硬件IIC通信的协议实体,我们将一个空白的config，注册了配置好的iic的HAL库句柄，提供了IIC地址和最大可接受的延迟时间

​`oled_init_hardiic_handle`则是进一步的从协议层飞跃到设备层，完成一个OLED设备的注册，即，我们注册了一个使用硬件IIC通信的OLED。现在，我们就可以直接拿这个OLED进行绘点了。

```text
void test_set_pixel_line(
    OLED_Handle* handle, uint8_t xoffset, uint8_t y_offset)
{
    for(uint8_t i = 0; i < 20; i++)
        oled_helper_setpixel(handle,xoffset * i, y_offset * i);
    oled_helper_update(handle);
}

void test_oled_iic_functionalities()
{
    OLED_Handle handle;
    // 注册了一个使用硬件IIC通信的OLED
    user_init_hard_iic_oled_handle(&handle);
    // 绘制一个
    test_set_pixel_line(&handle, 1, 2);
    HAL_Delay(1000);
    test_clear(&handle);
    test_set_pixel_line(&handle, 2, 1);
    HAL_Delay(1000);
    test_clear(&handle);
}
```

​这个测试并不全面，自己可以做修改。效果就是在导言当中的视频开始的两条直线所示。

​笔者的OLED设备层的代码已经全部开源到[MCU_Libs/OLED/library/OLED at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/OLED)，感兴趣的朋友可以进一步研究。

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架（绘图设备抽象）

## 图像层的底层抽象------绘图设备抽象

​在上一篇博客中，我们完成了对设备层的抽象。现在，我们终于可以卖出雄心壮志的一步了！那就是尝试去完成一个最为基础的图形库。我们要做的，就是设计一个更加复杂的绘图设备。

​为什么是绘图设备呢？我们程序员都是懒蛋，想要最大程度的复用代码，省最大的力气干最多的事情。所以，我们的图像框架在未来，还会使用LCD绘制，还会使用其他形形色色的绘制设备来绘制我们的图像。而不仅限于OLED。所以，让我们抽象一个可以绘制的设备而不是一个OLED设备，是非常重要的。

​一个绘图设备，是OLED设备的的子集。他可以开启关闭，完成绘制操作，刷新绘制操作，清空绘制操作。仅此而已。

```text
typedef void*   CCDeviceRawHandle;
typedef void*   CCDeviceRawHandleConfig;

// 初始化设备，设备需要做一定的初始化后才能绘制图形
typedef void(*Initer)(
    CCDeviceHandler* handler, 
    CCDeviceRawHandleConfig config);

// 清空设备
typedef void(*ClearDevice)(
    CCDeviceHandler* handler);

// 更新设备
typedef void(*UpdateDevice)(
    CCDeviceHandler* handler);

// 反色设备
typedef void(*ReverseDevice)(
    CCDeviceHandler* handler);

// 绘制点
typedef void(*SetPixel)(
    CCDeviceHandler* handler, uint16_t x, uint16_t y);

// 绘制面
typedef void(*DrawArea)(
    CCDeviceHandler* handler, 
    uint16_t x, uint16_t y, 
    uint16_t width, uint16_t height, uint8_t* sources
);

// 面操作（清空，反色，更新等等，反正不需要外来提供绘制资源的操作）
typedef void(*AreaOperation)(
    CCDeviceHandler* handler, 
    uint16_t x, uint16_t y, 
    uint16_t width, uint16_t height
);

// 这个比较新，笔者后面讲
typedef enum{
    CommonProperty_WIDTH,
    CommonProperty_HEIGHT,
    CommonProperty_SUPPORT_RGB
}CommonProperty;

// 获取资源的属性
typedef void(*FetchProperty)(CCDeviceHandler*, void*, CommonProperty p);

// 一个绘图设备可以完成的操作
// 提示，其实可以化简，一些函数指针（或者说方法）是没有必要存在的，思考一下如何化简呢？
typedef struct __DeviceOperations 
{
    Initer          init_function;
    ClearDevice     clear_device_function;
    UpdateDevice    update_device_function;
    SetPixel        set_pixel_device_function;
    ReverseDevice   reverse_device_function;
    DrawArea        draw_area_device_function;
    AreaOperation   clearArea_function;
    AreaOperation   updateArea_function;
    AreaOperation   reverseArea_function;
    FetchProperty   property_function;
}CCDeviceOperations;

// 一个绘图设备的最终抽象
typedef struct __DeviceProperty
{
    /* device type */
    CCDeviceType            device_type;
    /* device raw data handle */
    CCDeviceRawHandle       handle;
    /* device functions */
    CCDeviceOperations      operations;
}CCDeviceHandler;
```

​设计上笔者是自底向上设计的，笔者现在打算自顶向下带大伙解读一下我的代码。

### 如何抽象一个绘图设备？

​这个设备是什么？是一个OLED？还是一个LCD？

```text
/* device type */
CCDeviceType            device_type;
```

​这个设备的底层保存资源是什么？当我们动手准备操作的时候，需要拿什么进行操作呢？

```text
/* device raw data handle */
CCDeviceRawHandle       handle;
```

> 你不需要在使用的时候关心他到底是什么，因为我们从头至尾都在使用接口进行操作，你只需要知道，一个绘图设备可以绘制图像，这就足够了

```text
/* device functions */
CCDeviceOperations      operations;
```

​这里是我们的命根子，一个绘图设备可以完成的操作。我们在之后的设计会大量的见到operations这个操作。

> 笔者的operations借鉴了Linux是如何抽象文件系统的代码。显然，一个良好的面对对象C编写规范的参考代码就是Linux的源码

​下一步，就是DeviceType有哪些呢？目前，我们开发的是OLED，也就意味着只有OLED是一个合法的DeviceType

```text
typedef enum{
    OLED_Type
}CCDeviceType;
```

​最后，我们需要思考的是，如何定义一个绘图设备的行为呢？我们知道我们现在操作的就是一个OLED，所以，我们的问题实际上就转化成为：

> 当我们给定了一个明确的，是OLED设备的绘图设备的时候，怎么联系起来绘图设备和OLED设备呢？

​答案还是回到我们如何抽象设备层的代码上，那就是根据我们的类型来选择我们的方法。

```text
/* calling this is not encouraged! */
void __register_paintdevice(
    CCDeviceHandler* blank_handler, 
    CCDeviceRawHandle raw_handle, 
    CCDeviceRawHandleConfig config, 
    CCDeviceType type);

#define register_oled_paintdevice(handler, raw, config) \
    __register_paintdevice(handler, raw, config, OLED_Type)
```

​所以，我们注册一个OLED的绘图设备，只需要调用接口register_oled_paintdevice就好了，提供一个干净的OLED_HANDLE和初始化OLED_HANDLE所需要的资源，我们的设备也就完成了初始化。

```text
#include "Graphic/device_adapter/CCGraphic_device_oled_adapter.h"
#include "Graphic/CCGraphic_device_adapter.h"

void __register_paintdevice(
    CCDeviceHandler* blank_handler, 
    CCDeviceRawHandle raw_handle, 
    CCDeviceRawHandleConfig config, 
    CCDeviceType type)
{
    blank_handler->handle = raw_handle;
    blank_handler->device_type = type;
    switch(type)
    {
        case OLED_Type:
        {
            blank_handler->operations.init_function = 
                (Initer)init_device_oled;
            blank_handler->operations.clear_device_function =
                clear_device_oled;
            blank_handler->operations.set_pixel_device_function = 
                setpixel_device_oled;
            blank_handler->operations.update_device_function = 
                update_device_oled;
            blank_handler->operations.clearArea_function =
                clear_area_device_oled;
            blank_handler->operations.reverse_device_function =
                reverse_device_oled;
            blank_handler->operations.reverseArea_function = 
                reversearea_device_oled;
            blank_handler->operations.updateArea_function = 
                update_area_device_oled;
            blank_handler->operations.draw_area_device_function =
                draw_area_device_oled;
            blank_handler->operations.property_function = 
                property_fetcher_device_oled;
        }
        break;
    }
    blank_handler->operations.init_function(blank_handler, config);
}
```

​这个仍然是最空泛的代码，我们只是简单的桥接了一下，声明我们的设备是OLED，还有真正完成桥接的文件：`CCGraphic_device_oled_adapter`文件没有给出来。所以，让我们看看实际上是如何真正的完成桥接的。

#### 桥接绘图设备，特化为OLED设备

​什么是桥接？什么是特化？**桥接指的是讲一个抽象结合过度到另一个抽象上，在这里，我们讲绘图设备引渡到我们的OLED设备而不是其他更加宽泛的设备上去，而OLED设备属于绘图设备的一个子集，看起来，我们就像是把虚无缥缈的"绘图设备"落地了，把一个抽象的概念更加具体了。**我们的聊天从"用绘图设备完成XXX"转向了"使用一个OLED作为绘图设备完成XXX"了。这就是特化，将一个概念明晰起来。

```c
#include "Graphic/CCGraphic_device_adapter.h"
#include "OLED/Driver/oled_config.h"

/* 
 * 提供用于 OLED 设备的相关操作函数 
 */

/**
 * @struct CCGraphic_OLED_Config
 * @brief OLED 设备的配置结构体
 */
typedef struct {
    OLED_Driver_Type    createType;      // OLED 驱动类型（软 I2C、硬 I2C 等）
    void*               related_configs; // 与驱动相关的具体配置
} CCGraphic_OLED_Config;

/**
 * @brief 初始化 OLED 设备
 * @param blank 空的设备句柄，初始化后填充
 * @param onProvideConfigs OLED 配置参数指针，包含驱动类型及配置
 * 
 * @note 调用此函数时需要传递初始化好的配置（软 I2C 或硬 I2C 配置等）
 */
void init_device_oled(
    CCDeviceHandler* blank, CCGraphic_OLED_Config* onProvideConfigs);

/**
 * @brief 刷新整个 OLED 屏幕内容
 * @param handler 设备句柄
 */
void update_device_oled(CCDeviceHandler* handler);

/**
 * @brief 清空 OLED 屏幕内容
 * @param handler 设备句柄
 */
void clear_device_oled(CCDeviceHandler* handler);

/**
 * @brief 设置指定位置的像素点
 * @param handler 设备句柄
 * @param x 横坐标
 * @param y 纵坐标
 */
void setpixel_device_oled(CCDeviceHandler* handler, uint16_t x, uint16_t y);

/**
 * @brief 清除指定区域的显示内容
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void clear_area_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/**
 * @brief 更新指定区域的显示内容
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void update_area_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/**
 * @brief 反转整个屏幕的显示颜色
 * @param handler 设备句柄
 */
void reverse_device_oled(CCDeviceHandler* handler);

/**
 * @brief 反转指定区域的显示颜色
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void reversearea_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height);

/**
 * @brief 绘制指定区域的图像
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 * @param sources 图像数据源指针
 */
void draw_area_device_oled(
    CCDeviceHandler* handler, 
    uint16_t x, uint16_t y, 
    uint16_t width, uint16_t height, uint8_t* sources
);

/**
 * @brief 获取设备属性
 * @param handler 设备句柄
 * @param getter 属性获取指针
 * @param p 属性类型
 */
void property_fetcher_device_oled(
    CCDeviceHandler* handler, void* getter, CommonProperty p
);
```

​好在代码实际上并不困难，具体的代码含义我写在下面了，可以参考看看

```text
#include "Graphic/device_adapter/CCGraphic_device_oled_adapter.h"
#include "OLED/Driver/oled_base_driver.h"

/**
 * @brief 初始化 OLED 设备
 * 
 * 根据提供的配置（软 I2C、硬 I2C、软 SPI、硬 SPI）初始化 OLED 设备。
 * 
 * @param blank 空的设备句柄，初始化后填充
 * @param onProvideConfigs OLED 配置参数指针，包含驱动类型及具体配置
 */
void init_device_oled(
    CCDeviceHandler* blank, CCGraphic_OLED_Config* onProvideConfigs)
{
    OLED_Handle* handle = (OLED_Handle*)(blank->handle);
    OLED_Driver_Type type = onProvideConfigs->createType;

    switch(type)
    {
        case OLED_SOFT_IIC_DRIVER_TYPE:
            oled_init_softiic_handle(
                handle,
                (OLED_SOFT_IIC_Private_Config*) (onProvideConfigs->related_configs)
            );
        break;

        case OLED_HARD_IIC_DRIVER_TYPE:
            oled_init_hardiic_handle(
                handle, 
                (OLED_HARD_IIC_Private_Config*)(onProvideConfigs->related_configs));
        break;

        case OLED_SOFT_SPI_DRIVER_TYPE:
            oled_init_softspi_handle(
                handle,
                (OLED_SOFT_SPI_Private_Config*)(onProvideConfigs->related_configs)
            );
        break;

        case OLED_HARD_SPI_DRIVER_TYPE:
            oled_init_hardspi_handle(
                handle,
                (OLED_HARD_SPI_Private_Config*)(onProvideConfigs->related_configs)
            );
        break;
    }
}

/**
 * @brief 刷新整个 OLED 屏幕内容
 * 
 * @param handler 设备句柄
 */
void update_device_oled(CCDeviceHandler* handler)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_update(handle);
}

/**
 * @brief 清空 OLED 屏幕内容
 * 
 * @param handler 设备句柄
 */
void clear_device_oled(CCDeviceHandler* handler)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_clear_frame(handle);
}

/**
 * @brief 设置指定位置的像素点
 * 
 * @param handler 设备句柄
 * @param x 横坐标
 * @param y 纵坐标
 */
void setpixel_device_oled(CCDeviceHandler* handler, uint16_t x, uint16_t y)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_setpixel(handle, x, y);
}

/**
 * @brief 清除指定区域的显示内容
 * 
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void clear_area_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_clear_area(handle, x, y, width, height);
}

/**
 * @brief 更新指定区域的显示内容
 * 
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void update_area_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_update_area(handle, x, y, width, height);
}

/**
 * @brief 反转整个屏幕的显示颜色
 * 
 * @param handler 设备句柄
 */
void reverse_device_oled(CCDeviceHandler* handler)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_reverse(handle);
}

/**
 * @brief 反转指定区域的显示颜色
 * 
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 */
void reversearea_device_oled(CCDeviceHandler* handler, 
        uint16_t x, uint16_t y, uint16_t width, uint16_t height)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_reversearea(handle, x, y, width, height);
}

/**
 * @brief 绘制指定区域的图像
 * 
 * @param handler 设备句柄
 * @param x 区域起点的横坐标
 * @param y 区域起点的纵坐标
 * @param width 区域宽度
 * @param height 区域高度
 * @param sources 图像数据源指针
 */
void draw_area_device_oled(
    CCDeviceHandler* handler, 
    uint16_t x, uint16_t y, 
    uint16_t width, uint16_t height, uint8_t* sources
){
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    oled_helper_draw_area(handle, x, y, width, height, sources);
}

/**
 * @brief 获取 OLED 设备属性
 * 
 * @param handler 设备句柄
 * @param getter 属性获取指针
 * @param p 属性类型（如：高度、宽度、是否支持 RGB 等）
 */
void property_fetcher_device_oled(
    CCDeviceHandler* handler, void* getter, CommonProperty p
)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    switch (p)
    {
    case CommonProperty_HEIGHT:
    {   
        int16_t* pHeight = (int16_t*)getter;
        *pHeight = oled_height(handle);
    } break;

    case CommonProperty_WIDTH:
    {
        int16_t* pWidth = (int16_t*)getter;
        *pWidth = oled_width(handle);
    } break;

    case CommonProperty_SUPPORT_RGB:
    {
        uint8_t* pSupportRGB = (uint8_t*)getter;
        *pSupportRGB = oled_support_rgb(handle);
    } break;

    default:
        break;
    }
}
```

#### 题外话：设备的属性，与设计一个相似函数化简的通用办法

​绘图设备有自己的属性，比如说告知自己的可绘图范围，是否支持RGB色彩绘图等等，我们的办法是提供一个对外暴露的可以访问的devicePropertyEnum

```text
typedef enum{
    CommonProperty_WIDTH,
    CommonProperty_HEIGHT,
    CommonProperty_SUPPORT_RGB
}CommonProperty;
```

​设计一个接口，这个接口函数就是FetchProperty

```text
typedef void(*FetchProperty)(CCDeviceHandler*, void*, CommonProperty p);
```

​上层框架代码提供一个承接返回值的void\*和查询的设备以及查询类型，我们就返回这个设备的期望属性

```yaml
/**
 * @brief 获取 OLED 设备属性
 * 
 * @param handler 设备句柄
 * @param getter 属性获取指针
 * @param p 属性类型（如：高度、宽度、是否支持 RGB 等）
 */
void property_fetcher_device_oled(
    CCDeviceHandler* handler, void* getter, CommonProperty p
)
{
    OLED_Handle* handle = (OLED_Handle*)handler->handle;
    switch (p)
    {
    case CommonProperty_HEIGHT:
    {   
        int16_t* pHeight = (int16_t*)getter;
        *pHeight = oled_height(handle);
    } break;

    case CommonProperty_WIDTH:
    {
        int16_t* pWidth = (int16_t*)getter;
        *pWidth = oled_width(handle);
    } break;

    case CommonProperty_SUPPORT_RGB:
    {
        uint8_t* pSupportRGB = (uint8_t*)getter;
        *pSupportRGB = oled_support_rgb(handle);
    } break;

    default:
        break;
    }
}
```

​这个就是一种设计**返回相似内容的数据的设计思路，将过多相同返回的函数简化为一个函数，将差异缩小到使用枚举宏而不是一大坨函数到处拉屎的设计方式**

> 任务提示：笔者这里实际上做的不够好，你需要知道的是，我在这里是没有做错误处理的。啥意思？你必须让人家知道你返回的值是不是合法的，人家才知道这个值敢不敢用。
>
> 笔者提示您，两种办法：
>
> 1.  返回值上动手脚：这个是笔者推介的，也是Linux设备代码中使用的，那就是将属性获取的函数签名返回值修改为uint8_t，或者更进一步的封装：
>
>     ```
>     typedef enum {
>         FETCH_PROPERTY_FAILED;  // 0, YOU CAN USE AS FALSE, BUT NOT RECOMMENDED!
>         FETCH_PROPERTY_SUCCESS; // 1, YOU CAN USE AS TRUE, BUT NOT RECOMMENDED!
>     }FetchPropertyStatus;
>
>     /**
>      * @brief 获取 OLED 设备属性
>      * 
>      * @param handler 设备句柄
>      * @param getter 属性获取指针
>      * @param p 属性类型（如：高度、宽度、是否支持 RGB 等）
>      * @return 
>      */
>     FetchPropertyStatus property_fetcher_device_oled(
>         CCDeviceHandler* handler, void* getter, CommonProperty p
>     )
>     {
>         OLED_Handle* handle = (OLED_Handle*)handler->handle;
>         switch (p)
>         {
>         case CommonProperty_HEIGHT:
>         {   
>             int16_t* pHeight = (int16_t*)getter;
>             *pHeight = oled_height(handle);
>         } break;
>
>         case CommonProperty_WIDTH:
>         {
>             int16_t* pWidth = (int16_t*)getter;
>             *pWidth = oled_width(handle);
>         } break;
>
>         case CommonProperty_SUPPORT_RGB:
>         {
>             uint8_t* pSupportRGB = (uint8_t*)getter;
>             *pSupportRGB = oled_support_rgb(handle);
>         } break;
>
>         default:
>             return FETCH_PROPERTY_FAILED; // not supported property
>         }
>         return FETCH_PROPERTY_SUCCESS; // fetched value can be used for further
>     }
>     ```
>
>     使用上，事情也就变得非常的简单，笔者后面的一个代码
>
>     ```
>     int16_t device_width = 0;
>     device_handle->operations.property_function(
>         device_handle, &device_width, CommonProperty_WIDTH
>     );
>     int16_t device_height = 0;
>     device_handle->operations.property_function(
>         device_handle, &device_height, CommonProperty_HEIGHT
>     );
>     ```
>
>     也就可以更加合理的修改为
>
>     ```
>     FetchPropertyStatus status;
>     // fetch the width property
>     int16_t device_width = 0;
>     status = device_handle->operations.property_function(
>         device_handle, &device_width, CommonProperty_WIDTH
>     );
>     // check if the value valid
>     if(!statue){
>         // handling error, or enter HAL_Hard_Fault... anyway!
>     }
>     int16_t device_height = 0;
>     statue = device_handle->operations.property_function(
>         device_handle, &device_height, CommonProperty_HEIGHT
>     );
>     // check if the value valid
>     if(!statue){
>         // handling error, or enter HAL_Hard_Fault... anyway!
>     }
>     // now pass the check
>     // use the variable directly
>     ...
>     ```
>
> 2.  选取一个非法值。比如说
>
>     ```
>     #define INVALID_PROPERTY_VALUE      -1
>     ...
>     default:
>         {  
>             (int8_t*)value = (int8_t*)getter;
>             value = INVALID_PROPERTY_VALUE;
>         }
>     ```
>
>     但是显然不好！我们没办法区分：是不支持这个属性呢？还是设备的返回值确实就是-1呢？谁知道呢？所以笔者很不建议在这样的场景下这样做！甚至更糟糕的，如果是返回设备的长度，我们使用的是uint16_t接受，那么我们完全没办法区分究竟是设备是0xFFFF长，还是是非法值呢？**我们一不小心把判断值的非法和值的含义本身混淆在一起了！**

​现在，我们就可以完成对一整个设备的抽象了。

#### 使用函数指针来操作设备

​笔者之前的代码已经反反复复出现了使用函数指针而不是调用函数来进行操作，从开销分析上讲，我们多了若干次的解引用操作，但是从封装上，我们明确的归属了函数隶属于绘图设备的方法，在极大量的代码下，这样起到了一种自说明的效果。

​比起来，在业务层次（拿库做应用的层次，比如说开发一个OLED菜单，做一个恐龙奔跑小游戏，或者是绘制电棍突脸尖叫的动画），我们只需要强调是这个设备在绘图

```text
device_handle->operations.updateArea_function(...);
```

​而不是我们让绘图的是这个设备

```text
updateArea_device(device_handle, ...);
```

​显然前者更加的自然。

#### 总结一下

​其实，就是完成了对绘图设备的特化，现在，我们终于可以直接使用Device作为绘图设备而不是OLED_Handle，下一步，我们就开始真正的手搓设备绘制了。

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架（基础图形库的抽象）

## 基础图形库的抽象

​历经千辛万苦，我们终于可以开始行动起来，绘制图形了。我们将要绘制线，矩形，圆，椭圆等一系列基础的图形。问我其他的绘制呢？不必着急，我们慢慢来谈。

​有没有发现我们现在的谈论越来越高层了？我们现在绘制图像的时候还会关心我用的是硬件IIC或者是软件SPI吗？不会，你甚至可能才意识到我们使用的是OLED！这就是抽象带给我们的好处。我们现在脑子里只有抽象的绘图设备这个概念。它可以绘制点，面。仅此而已。

​本篇的代码在：[MCU_Libs/OLED/library/Graphic/base at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/Graphic/base)

## 抽象图形

### 抽象点

#### 设计我们的抽象

​我们即将迈出我们的第一步，那就是绘制一个点。

```c
typedef uint16_t    PointBaseType;
/*
    x:  The x-coordinate of the point
    y:  The y-coordinate of the point
    operations: 
        An instance of CCGraphic_BaseOperations that 
        stores operations or behaviors related to the point, 
        likely used for drawing or other graphical manipulations.
*/
typedef struct __CCGraphic_Point{
    PointBaseType                     x;
    PointBaseType                     y;
}CCGraphic_Point;

void CCGraphic_init_point(CCGraphic_Point* point, 
        PointBaseType x, PointBaseType y);
void CCGraphic_draw_point(CCDeviceHandler* handler, CCGraphic_Point* point);
```

​一个点的基本组成，就是给定一个由两个数的组合------X和Y，长度上，笔者为了防止特大设备，使用了PointBaseType隔离了具体的长度大小。

> 小技巧：
>
> 当你发现一个问题很复杂的时候，最好的办法就是隔离！将大问题分解为若干的小问题，以笔者上面遇到的困难为例子。如何保证自己的点可以分布在满足设备宽度的平面上呢？答案是分解问题：**点分布在平面上，使用的是对平面属性的PointBaseType上，他只知道自己属于这个类型，就一定不会超越所在的平面，不会出现绘图平面过大导致使用的数据类型发生溢出**，至于如何保证不发生溢出呢？那是另一个问题，笔者使用的架构下，不会出现uint16_t不够使用的问题。但是如果的确出现了超大设备，我只需要轻而易举的定义一个HYPER_LARGE_DEVICE的宏，或者是面对资源极端紧张的嵌入式设备，定义一个HYPER_SMALL_DEVICE，就可以让所有的资源占用瞬间缩小一半
>
> ```
> #ifdef  HYPER_LARGE_DEVICE
> typedef uint32_t    PointBaseType;
> #elif defined(HYPER_SMALL_DEVICE)
> typedef uint8_t     PointBaseType;
> #else
> typedef uint16_t    PointBaseType;
> #endif
> ```
>
> 而我其他的代码一行都不用动，轻而易举的完成了迁移。

#### 实现我们的抽象

​让我们看看我们的代码多么简洁吧！

```text
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"
#include "Graphic/CCGraphic_device_adapter.h"

void CCGraphic_draw_point(
    CCDeviceHandler* handler, CCGraphic_Point* point)
{
    handler->operations.set_pixel_device_function(
        handler, point->x, point->y);
}

void CCGraphic_init_point(CCGraphic_Point* point, 
    PointBaseType x, PointBaseType y)
{
    point->x = x;
    point->y = y;
}
```

​绘制一个点，**就是调用了设备的绘制点的办法**。你问我咋绘制的？**啥？你需要关心吗？我不说你可能都不知道我是拿的LCD做测试呢（笑）**，但是，这里我需要严肃提醒的是------不要在关心实时性的绘图设备上这样做，让我们看一看调用链就好了：

```text
CCGraphic_draw_point -> set_pixel_device_function(实际上就是setpixel_device_oled) -> oled_helper_setpixel
```

​也就是说，我们多调用了两次functions来换取对任意设备的抽象。但是我也可以一行代码不改，就可以完全把调用链换成

```text
CCGraphic_draw_point -> set_pixel_device_function(实际上就是setpixel_device_lcd) -> lcd_helper_setpixel
```

​多简单！

### 测试

​现在我们就可以开始测试了

```text
OLED_HARD_IIC_Private_Config pvt_config;
OLED_Handle handle;
CCGraphic_OLED_Config config;

void on_test_init_hardiic_oled(CCDeviceHandler* device)
{
    bind_hardiic_handle(
        &pvt_config, &hi2c1, 0x78, HAL_MAX_DELAY
    );
    config.createType = OLED_HARD_IIC_DRIVER_TYPE;
    config.related_configs = &pvt_config;
    register_oled_paintdevice(device, &handle, &config);
}

void on_test_draw_points(CCDeviceHandler* handle)
{
    CCGraphic_Point point;
    CCGraphic_init_point(&point, 0, 0);
    for(uint8_t i = 0; i < 20; i++)
    {
        point.x = i;
        point.y = i * 2;
        CCGraphic_draw_point(handle, &point);
    }
    handle->operations.update_device_function(handle);
}

// at main.c
CCDeviceHandler handler;
on_test_init_hardiic_oled(&handler);
on_test_draw_points(&handler);
```

​不出意外的话不会有任何问题。

### 抽象线

​线的绘制开始有所讲究了，我们需要使用更好的，不涉及浮点数运算的办法来尽可能的回避耗费时间的浮点数运算。这隶属于计算机架构体系的内容，关于ARM，计算浮点数远远比计算整数的开销大（除非使用的是更贵的特化硬件）。现在，让我们开始绘制线线

#### 设计我们的抽象

​笔者建议你看到这里了，先自己构思一下如果是你，你如何抽象呢？

​笔者先给你看看江科大的代码

```text
void OLED_DrawLine(int16_t X0, int16_t Y0, int16_t X1, int16_t Y1)
{
    ...
}
```

​啥？你问我抽象呢？怎么是实现呢？我只能说------它的函数签名就是抽象咯（笑）。各种处理混在一起，是这样的代码非常难读的一个根本原因。

​笔者揭晓我的抽象。

```c
#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Line{
    CCGraphic_Point p_left;
    CCGraphic_Point p_right;
}CCGraphic_Line;

void CCGraphic_init_line(   CCGraphic_Line* line, 
                            CCGraphic_Point pl, 
                            CCGraphic_Point pr);

void CCGraphic_draw_line(CCDeviceHandler* handler, CCGraphic_Line* line);
```

> 一个争论：
>
> ​ 这样实现好不好啊？
>
> ```
> typedef struct __CCGraphic_Line{
>  CCGraphic_Point* p_left;
>  CCGraphic_Point* p_right;
> }CCGraphic_Line;
> ```
>
> ​ 笔者思考过，事实上，笔者第一代的OLED框架（当然，远远没有现在的那么完善，也远远没有现在的好，甚至还有bug）就是这样实现的。我既然跟上面的实现不一致，那显然，有好处也就有坏处。
>
> ​ 我们需要思考的是------我们的对象指针和对象本身表达的含义的区别是什么。关于这个说法，婆说婆有理，公说公有理，笔者这里给出的看法是：
>
> ​ **对象本身在结构体中的声明是一种上层抽象对底层对象的强所属权，也就是说，对于每一个整个结构体模板刻出来的结构体对象的成员而言，内部所拥有的点都是独一无二的。**换而言之：这就是我的资源，不是借的，更不是偷的！所以现在笔者采用的抽象，更加像是线对点宣誓了主权，这就是线组成的点，没有任何可以商量的余地。
>
> ​ **对象指针则是一种弱的引用，表达的是一种借用。**上面使用指针占用的抽象，更加像是：借来了两个点，然后用一下这两个点来描述了一下一根直线。用完了对象释放干净了，也就作罢了，但是点本身不会消失。就像我们用一根笔连起来了两个点，组成了一根线，现在我们只是把线擦除了，但是点还在呢！它还可以用来做别的事情。
>
> ​ 从内存占用上来看，在ARM32体系上，我们都知道指针的大小是32位，4个字节，所以，我们一个sizeof就能得到使用指针抽象的线也就是8个字节。是一个恒定的大小。对于现在笔者采用的抽象，则是2倍的CCGraphic_Point大小，随着不同的PointBaseType, Line自身的大小也会发生波动，在uint8_t设备上，我们一共是4个字节大小，比指针描述的小，在uint16_t上则是不分伯仲，对于超大设备Line的大小就会膨胀为指针实现的两倍。
>
> ​ 但是，另一方面，正如我所说的，这样的资源只是借用，他必须存在于哪个地方，问题来了，你能保证你所使用的点总是有效的吗？
>
> ```
> CCGraphic_Line  l;
> {
>     CCGraphic_Point tl;
>     CCGraphic_Point br;
>     CCGraphic_init_line(&l, tl, br);
> }
> // 在这里使用还安全嘛？
> CCGraphic_draw_line(&handle, &l);
> ```
>
> 你也许知道你使用的对象是有效的，但是客户程序员呢？他不知道啊？随后应用层的程序因为非法的内存访问崩溃了（进入了Hard_Fault），他还要幸幸苦苦看你的实现，然后沮丧的调试了一天发现是库作者这个家伙居然只是借用点！最后代来的时间的开销是任何人都无法接受的，这样不确定的风险分明更加的剧烈。
>
> 笔者想要说的是：每一个设计都有它的优点和缺点，作为一个合格的程序员，不管是嵌入式程序员，还是架构设计师，都需要明确的表达自己资源的所属权，以及，不要违反"最小惊讶原则"（例子：这个怎么资源突然非法了！为什么库没有帮助我维护？？？）

#### 实现我们的抽象

​规避浮点数运算！这个是我早就说了的。我们需要请出的算法就是[Bresenham (montana.edu)](https://www.cs.montana.edu/courses/spring2009/425/dslectures/Bresenham.pdf)算法，这个算法本质上使用的是DDA算法，一种整数微分思维。我们对得到的微分做一次取整，得到的就是整数的点（这是可以接受的，我们没办法在一个LCD或者是OLED上绘制坐标为`(1.25, 4.75)`的点，不是吗？）

​为了化简，我们对绘制直线进行分类讨论

1.  绘制一条垂直的线
2.  绘制一条水平的线
3.  绘制任意斜率的线

```text
void CCGraphic_draw_line(CCDeviceHandler* handler, CCGraphic_Line* line)
{ 
    // test if the vertical
    if(line->p_left.x == line->p_right.x) 
        return __on_handle_vertical_line(handler, line);   
    if(line->p_left.y == line->p_right.y)
        return __on_handle_horizental_line(handler, line);
    return __pvt_BresenhamMethod_line(handler, line);
}
```

​没想到吧，笔者就用了这几行，完成了这几个事情。好吧，我承认这样有点耍赖了。实际上内部还是颇为复杂，但是，绘制垂直还有水平的线是轻而易举的，试一试？来看看笔者的代码吧！

##### 绘制垂直的和水平的线

```text
/*
    draw the lines that matches the equal x
*/
static void __on_handle_vertical_line(
    CCDeviceHandler* handler,
    CCGraphic_Line* line
)
{
    PointBaseType max_y = max_uint16(line->p_left.y, line->p_right.y);
    PointBaseType min_y = min_uint16(line->p_left.y, line->p_right.y);
    CCGraphic_Point p;
    p.x = line->p_left.x;
    for(PointBaseType i = min_y; i <= max_y; i++)
    {
        p.y = i;
        CCGraphic_draw_point(handler, &p);
    }
}

static void __on_handle_horizental_line(
    CCDeviceHandler* handler,
    CCGraphic_Line* line
)
{
    PointBaseType max_x = max_uint16(line->p_left.x, line->p_right.x);
    PointBaseType min_x = min_uint16(line->p_left.x, line->p_right.x);
    CCGraphic_Point p;
    p.y = line->p_left.y;
    for(PointBaseType i = min_x; i <= max_x; i++)
    {
        p.x = i;
        CCGraphic_draw_point(handler, &p);
    }
}
```

​我下面来谈论一下一些要点：

> 1.  解释一下max_uint16和min_uint16?
>
>     没啥好解释的啊？这个就是择取大者和小者，有啥好说的呢？
>
> 2.  为什么变量没有像江科大那样一股脑堆在前面呢？
>
>     笔者可以给出充分的原因：我希望变量出现在它该出现的位置，比起来，你也不喜欢看变量一坨屎拉在了函数的前面，下面看实现的时候漫天找这个变量在哪里吧。没那个必要！但是这个需要看情况，如果作者实在不会哪怕一丁点的函数设计，把代码一股脑的堆到了一个函数里，那还不如江科大的变量写法！
>
> 3.  为什么不考虑
>
>     ```
>     {
>         PointBaseType max_y = max_uint16(line->p_left.y, line->p_right.y);
>         PointBaseType min_y = min_uint16(line->p_left.y, line->p_right.y);
>         for(PointBaseType i = min_y; i <= max_y; i++)
>         {
>             CCGraphic_Point p;
>             p.x = line->p_left.x;
>             p.y = i;
>             CCGraphic_draw_point(handler, &p);
>         }
>     }
>     ```
>
>     这个是经典的效率之争。你相信所有的编译器，都会意识到："哦我的天，这个程序员是一个白痴，p的X坐标永远不会改变，这个白痴为什么要重新赋值一个相同的值max_y - min_y + 1次呢？"嘛？\
>     **你不敢！**，你永远也不知道使用你的代码的人，在用着怎样的老毕等编译器，他对这样的优化足够迟钝，以至于他对你那可怜的栈来来回回弹弹压压，让你的程序性能被砍到惊呼国骂。**你敢打赌使用你库的代码的人，足够的现代嘛？**那么，不如让我们的表述更加的明白
>
>     ```
>     {
>         PointBaseType max_x = max_uint16(line->p_left.x, line->p_right.x);
>         PointBaseType min_x = min_uint16(line->p_left.x, line->p_right.x);
>         CCGraphic_Point p;
>         p.y = line->p_left.y;
>         for(PointBaseType i = min_x; i <= max_x; i++)
>         {
>             p.x = i;
>             CCGraphic_draw_point(handler, &p);
>         }
>     }
>     ```
>
>     这样的代码的开销瞬间压到只剩下一次地址解引用和赋值操作了，一下子无论何种编译器，都能生成最为高效的字节码。
>
> 4.  参数设计的时候，对于复杂抽象类型，使用指针还是使用结构体本身传递参数？
>
>     ​ ARM32体系架构有16个寄存器，不同于x86老毕等，传递个结构体最后压内存去了，一些简单的POD类型（我们的Point就是一个简单的POD类型，只有数据没有方法）回直接解析内部的类型是整数，直接传送到寄存器中，将效率提升十几倍，而不用访问内存。这样看，对于一部分最为简单的结构体，直接传递对象本身不是一件特别耗操作的事情，但是，笔者仍然建议：**如果你希望这个资源只是被借用一下，或者，表达传递的就是这个对象本身，他在ARM广阔的内存海洋是独一无二的话，使用指针，哪怕他就一个字节大小！**
>
> 5.  所以，为什么在函数前面的最前面添加static
>
>     可惜了我们的C语言程序设计表达私有只能使用static办法，这表明，这个函数只能在文件内部访问，实际上的函数签名会被独特标记，导致外部生成的签名无法对应于实际上被static修饰的函数，这也就意味着无法通过编译！他没办法认识这个被static修饰的函数。**至于其他乱七八糟的什么重名问题，我负责的告诉你，不要指望所有编译器都会正确的反应你的UB行为，不然，你就会在"编译了半天发现被这个问题绊了一跤"和"这个程序的行为怎么这么诡异啊？不是跳转道我想要的函数"中二选一了，反正代价是你的一天被你的UB行为坑害（笑）**

##### 使用Bresenham算法完成任意斜率的绘制

```text
// Bresenham's Line Algorithm, designed to avoid floating point calculations
// References: https://www.cs.montana.edu/courses/spring2009/425/dslectures/Bresenham.pdf
// https://www.bilibili.com/video/BV1364y1d7Lo
void __pvt_BresenhamMethod_line(CCDeviceHandler* handler, CCGraphic_Line* line)
{
#define __pvt_fast_draw_point(X, Y) \
    do { \
        p.x = X; \
        p.y = Y; \
        CCGraphic_draw_point(handler, &p); \
    } while(0)

    // Define initial points for the line: p_left and p_right represent the endpoints
    int16_t startX = line->p_left.x;
    int16_t startY = line->p_left.y;
    int16_t endX = line->p_right.x;
    int16_t endY = line->p_right.y;

    // Flags to indicate transformations of coordinates
    uint8_t isYInverted = 0, isXYInverted = 0;
    {
        // If the start point's X coordinate is greater than the end point's X, swap the points
        if (startX > endX) {
            // Swap the X and Y coordinates for the start and end points
            swap_int16(&startX, &endX);
            swap_int16(&startY, &endY);
        }

        // If the start point's Y coordinate is greater than the end point's Y, invert the Y coordinates
        if (startY > endY) {
            // Invert Y coordinates to make the line direction consistent in the first quadrant
            startY = -startY;
            endY = -endY;
            // Set the flag indicating Y coordinates were inverted
            isYInverted = 1;
        }

        // If the line's slope (dy/dx) is greater than 1, swap X and Y coordinates for a shallower slope
        if (endY - startY > endX - startX) {
            // Swap X and Y coordinates for both points
            swap_int16(&startX, &startY);
            swap_int16(&endX, &endY);
            // Set the flag indicating both X and Y coordinates were swapped
            isXYInverted = 1;
        }

        // Calculate differences (dx, dy) and the decision variables for Bresenham's algorithm
        const int16_t dx = endX - startX;
        const int16_t dy = endY - startY;
        const int16_t incrE = 2 * dy;  // Increment for eastward movement
        const int16_t incrNE = 2 * (dy - dx);  // Increment for northeastward movement

        int16_t decision = 2 * dy - dx;  // Initial decision variable
        int16_t x = startX;  // Starting X coordinate
        int16_t y = startY;  // Starting Y coordinate

        // Draw the starting point and handle coordinate transformations based on flags
        CCGraphic_Point p;
        if (isYInverted && isXYInverted) {
            __pvt_fast_draw_point(y, -x);
        } else if (isYInverted) {
            __pvt_fast_draw_point(x, -y);
        } else if (isXYInverted) {
            __pvt_fast_draw_point(y, x);
        } else {
            __pvt_fast_draw_point(x, y);
        }

        // Iterate through the X-axis to draw the rest of the line
        while (x < endX) {
            x++;  // Increment X coordinate
            if (decision < 0) {
                decision += incrE;  // Move eastward if decision variable is negative
            } else {
                y++;  // Move northeastward if decision variable is positive or zero
                decision += incrNE;
            }

            // Draw each point along the line with coordinate transformation as needed
            if (isYInverted && isXYInverted) {
                __pvt_fast_draw_point(y, -x);
            } else if (isYInverted) {
                __pvt_fast_draw_point(x, -y);
            } else if (isXYInverted) {
                __pvt_fast_draw_point(y, x);
            } else {
                __pvt_fast_draw_point(x, y);
            }
        }
    }
#undef __pvt_fast_draw_point
}
```

​好长一大串，先不必着急，我一步步慢慢说。实际上，这个算法除了使用DDA以外，还用了化未知为已知的办法。我的意思是：

```text
// If the start point's X coordinate is greater than the end point's X, swap the points
if (startX > endX) {
    // Swap the X and Y coordinates for the start and end points
    swap_int16(&startX, &endX);
    swap_int16(&startY, &endY);
}

// If the start point's Y coordinate is greater than the end point's Y, invert the Y coordinates
if (startY > endY) {
    // Invert Y coordinates to make the line direction consistent in the first quadrant
    startY = -startY;
    endY = -endY;
    // Set the flag indicating Y coordinates were inverted
    isYInverted = 1;
}
```

​首先，确保我们的线总是向正的，斜率总是大于0

```text
// If the line's slope (dy/dx) is greater than 1, swap X and Y coordinates for a shallower slope
 if (endY - startY > endX - startX) {
     // Swap X and Y coordinates for both points
     swap_int16(&startX, &startY);
     swap_int16(&endX, &endY);
     // Set the flag indicating both X and Y coordinates were swapped
     isXYInverted = 1;
 }
```

​上面则是在斜率大于1的基础上，将变换映射到介于0 \< k \< 1的范围上。

​最后，使用核心算法直接绘制

```text
    // Calculate differences (dx, dy) and the decision variables for Bresenham's algorithm
    const int16_t dx = endX - startX;
    const int16_t dy = endY - startY;
    const int16_t incrE = 2 * dy;  // Increment for eastward movement
    const int16_t incrNE = 2 * (dy - dx);  // Increment for northeastward movement

    int16_t decision = 2 * dy - dx;  // Initial decision variable
    int16_t x = startX;  // Starting X coordinate
    int16_t y = startY;  // Starting Y coordinate

    // Draw the starting point and handle coordinate transformations based on flags
    CCGraphic_Point p;
    if (isYInverted && isXYInverted) {
        __pvt_fast_draw_point(y, -x);
    } else if (isYInverted) {
        __pvt_fast_draw_point(x, -y);
    } else if (isXYInverted) {
        __pvt_fast_draw_point(y, x);
    } else {
        __pvt_fast_draw_point(x, y);
    }

    // Iterate through the X-axis to draw the rest of the line
    while (x < endX) {
        x++;  // Increment X coordinate
        if (decision < 0) {
            decision += incrE;  // Move eastward if decision variable is negative
        } else {
            y++;  // Move northeastward if decision variable is positive or zero
            decision += incrNE;
        }

        // Draw each point along the line with coordinate transformation as needed
        if (isYInverted && isXYInverted) {
            __pvt_fast_draw_point(y, -x);
        } else if (isYInverted) {
            __pvt_fast_draw_point(x, -y);
        } else if (isXYInverted) {
            __pvt_fast_draw_point(y, x);    // 对角对称，互换XY即可变换
        } else {
            __pvt_fast_draw_point(x, y);
        }
    }
}
```

​这个代码就是直接翻译了我给的PDF的算法，下面来聊一聊算法之外的：

> 1.  使用宏来化简我们的工作
>
>     ```
>     #define __pvt_fast_draw_point(X, Y) \
>         do { \
>             p.x = X; \
>             p.y = Y; \
>             CCGraphic_draw_point(handler, &p); \
>         } while(0)
>     ```
>
>     这个是一个简单的封装宏，为什么使用do..while请参考笔者之前的博客（协议篇）
>
>     C没有constexpr，没有模板，有的时候会显得十分贫瘠，所以，我们只好忍一下，使用宏完成重复的，0开销的工作。

### 绘制三角形和矩形

#### 矩形

```c
#ifndef CCGraphic_Rectangle_H
#define CCGraphic_Rectangle_H

#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Rectangle{
    CCGraphic_Point         top_left;
    CCGraphic_Point         bottom_right;
}CCGraphic_Rectangle;

void CCGraphic_init_rectangle(
    CCGraphic_Rectangle* rect, CCGraphic_Point tl, CCGraphic_Point br);

void CCGraphic_draw_rectangle(
    CCDeviceHandler* handler, CCGraphic_Rectangle* rect);

void CCGraphic_drawfilled_rectangle(
    CCDeviceHandler* handler, CCGraphic_Rectangle* rect);

#endif
```

#### 三角形

```c
#ifndef CCGraphic_Triangle_H
#define CCGraphic_Triangle_H

#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Triangle
{
    CCGraphic_Point     p1;
    CCGraphic_Point     p2;
    CCGraphic_Point     p3;
}CCGraphic_Triangle;

void CCGraphic_init_triangle(
    CCGraphic_Triangle* triangle, 
    CCGraphic_Point     p1,
    CCGraphic_Point     p2,
    CCGraphic_Point     p3
);

void CCGraphic_draw_triangle(
    CCDeviceHandler*    handle,
    CCGraphic_Triangle* triangle
);

void CCGraphic_drawfilled_triangle(
    CCDeviceHandler*    handle,
    CCGraphic_Triangle* triangle
);

#endif
```

#### 实现

​我们还是使用Bresenham算法和Franklin算法完成我们对三角形和矩形的绘制

```text
#include "Graphic/base/CCGraphic_Triangle/CCGraphic_Triangle.h"
#include "Graphic/base/CCGraphic_Line/CCGraphic_Line.h"
#include "Graphic/CCGraphic_device_adapter.h"
#include "Graphic/common/CCGraphic_Utils.h"

void CCGraphic_init_triangle(
    CCGraphic_Triangle* triangle, 
    CCGraphic_Point     p1,
    CCGraphic_Point     p2,
    CCGraphic_Point     p3
)
{
    triangle->p1 = p1;
    triangle->p2 = p2;
    triangle->p3 = p3;
}

void CCGraphic_draw_triangle(
    CCDeviceHandler*    handle,
    CCGraphic_Triangle* triangle
)
{
    CCGraphic_Line  line;
    CCGraphic_init_line(&line, triangle->p1, triangle->p2);
    CCGraphic_draw_line(handle, &line);
    handle->operations.update_device_function(handle);
    CCGraphic_init_line(&line, triangle->p2, triangle->p3);
    CCGraphic_draw_line(handle, &line);
    handle->operations.update_device_function(handle);
    CCGraphic_init_line(&line, triangle->p1, triangle->p3);
    CCGraphic_draw_line(handle, &line);
}

static uint8_t __pvt_is_in_triangle(
    int16_t* triangles_x,
    int16_t* triangles_y,
    CCGraphic_Point* p)
{
    uint8_t is_in = 0;
    /*此算法由W. Randolph Franklin提出*/
    /*参考链接：https://wrfranklin.org/Research/Short_Notes/pnpoly.html*/
    for (uint8_t i = 0, j = 2; i < 3; j = i++)
    {
        if (((triangles_y[i] > p->y) != (triangles_y[j] > p->y)) &&
            (p->x < (triangles_x[j] - triangles_x[i]) * 
            (p->y - triangles_y[i]) / (triangles_y[j] - triangles_y[i]) + 
                triangles_x[i]))
        {
            is_in = !is_in;
        }
    }
    return is_in;
}

void CCGraphic_drawfilled_triangle(
    CCDeviceHandler*    handle,
    CCGraphic_Triangle* triangle
)
{
    int16_t triangles_x[] = 
        {triangle->p1.x, triangle->p2.x, triangle->p3.x};

    int16_t triangles_y[] = 
        {triangle->p1.y, triangle->p2.y, triangle->p3.y};

    int16_t minX = find_int16min(triangles_x, 3);
    int16_t minY = find_int16min(triangles_y, 3);

    int16_t maxX = find_int16max(triangles_x, 3);
    int16_t maxY = find_int16max(triangles_y, 3);
    
    CCGraphic_Point p;
    p.x = minX;
    p.y = minY;
    for(int16_t i = minX; i < maxX; i++)
    {
        for(int16_t j = minY; j < maxY; j++)
        {
            p.x = i;
            p.y = j;
            if(__pvt_is_in_triangle(triangles_x, triangles_y, &p))
            {
                CCGraphic_draw_point(handle, &p);
            }
        }
    }

}

#include "Graphic/base/CCGraphic_Rectangle/CCGraphic_Rectangle.h"
#include "Graphic/base/CCGraphic_Line/CCGraphic_Line.h"

void CCGraphic_init_rectangle(
    CCGraphic_Rectangle* rect, CCGraphic_Point tl, CCGraphic_Point br)
{
    rect->top_left = tl;
    rect->bottom_right = br;
}

void CCGraphic_draw_rectangle(
    CCDeviceHandler* handler, CCGraphic_Rectangle* rect)
{
    CCGraphic_Line l;
    CCGraphic_Point tmp;

    // draw top, set tmp as the top_right
    tmp.x = rect->bottom_right.x;
    tmp.y = rect->top_left.y;
    CCGraphic_init_line(&l, rect->top_left, tmp);
    CCGraphic_draw_line(handler, &l);

    // draw right
    CCGraphic_init_line(&l, tmp, rect->bottom_right);
    CCGraphic_draw_line(handler, &l);    

    // draw left
    tmp.x = rect->top_left.x;
    tmp.y = rect->bottom_right.y;
    CCGraphic_init_line(&l, rect->top_left, tmp);
    CCGraphic_draw_line(handler, &l);      

    // draw bottom
    CCGraphic_init_line(&l,tmp, rect->bottom_right);
    CCGraphic_draw_line(handler, &l);      
}

void CCGraphic_drawfilled_rectangle(
    CCDeviceHandler* handler, CCGraphic_Rectangle* rect)
{
    CCGraphic_Point p;
    for(PointBaseType 
        iterate_x = rect->top_left.x; 
        iterate_x <= rect->bottom_right.x; iterate_x++)
    {
        p.x = iterate_x;
        for(PointBaseType 
            iterate_y = rect->top_left.y; 
            iterate_y <= rect->bottom_right.y; iterate_y++)
        {
            p.y = iterate_y;
            CCGraphic_draw_point(handler, &p);
        }        
    }
}
```

> 小问题：提示，矩形的填充绘制是可以优化，你认为应该如何优化呢？（提示：我们是不是用错了device的功能了？）（可以在评论区回答的）

### 绘制圆，圆弧和椭圆

​没有什么特殊的，笔者出于一些人上不去github，先把代码放到这里。

> [MCU_Libs/OLED/library/Graphic/base at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/Graphic/base)

```c
#ifndef CCGraphic_Arc_H
#define CCGraphic_Arc_H
#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Arc{
    CCGraphic_Point     center;
    PointBaseType       radius;
    int16_t             start_degree;
    int16_t             end_degree;
}CCGraphic_Arc;

void CCGraphic_init_CCGraphic_Arc(
    CCGraphic_Arc*      handle,
    CCGraphic_Point     center,
    PointBaseType       radius,
    int16_t             start_degree,
    int16_t             end_degree  
);

void CCGraphic_draw_arc(
    CCDeviceHandler* handler,
    CCGraphic_Arc* handle
);

void CCGraphic_drawfilled_arc(
    CCDeviceHandler* handler,
    CCGraphic_Arc* handle
);

#endif

#ifndef __CCGraphic_Circle_H
#define __CCGraphic_Circle_H
#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Circle
{
    CCGraphic_Point             center;
    PointBaseType               radius;
}CCGraphic_Circle;

void CCGraphic_init_circle(CCGraphic_Circle* circle, CCGraphic_Point c, uint8_t radius);
void CCGraphic_draw_circle(CCDeviceHandler* handler, CCGraphic_Circle* circle);
void CCGraphic_drawfilled_circle(CCDeviceHandler* handler, CCGraphic_Circle* circle);
#endif

#ifndef CCGraphic_Ellipse_H
#define CCGraphic_Ellipse_H
#include "Graphic/base/CCGraphic_Base.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"

typedef struct __CCGraphic_Ellipse{
    CCGraphic_Point                 center;
    PointBaseType                   X_Radius;
    PointBaseType                   Y_Radius;  
}CCGraphic_Ellipse;

void CCGraphic_init_ellipse(
    CCGraphic_Ellipse*          handle, 
    CCGraphic_Point             center,
    PointBaseType               X_Radius,
    PointBaseType               Y_Radius 
);

void CCGraphic_draw_ellipse(
    CCDeviceHandler* handler,
    CCGraphic_Ellipse* ellipse
);

void CCGraphic_drawfilled_ellipse(
    CCDeviceHandler* handler,
    CCGraphic_Ellipse* ellipse
);

#endif
```

> 实现如下

```text
#include "Graphic/base/CCGraphic_Arc/CCGraphic_Arc.h"
#include <math.h>

void CCGraphic_init_CCGraphic_Arc(
    CCGraphic_Arc*      handle,
    CCGraphic_Point     center,
    PointBaseType       radius,
    int16_t             start_degree,
    int16_t             end_degree  
)
{
    handle->center          = center;
    handle->end_degree      = end_degree;
    handle->start_degree    = start_degree;
    handle->radius          = radius;
}

static uint8_t __pvt_is_in_angle(int16_t x, int16_t y, int16_t start, int16_t end)
{
    int16_t point_angle = (atan2(y, x) / 3.14 * 180);
    // 笔者的一个更加清晰的写法
    // if (start < end)    //起始角度小于终止角度的情况
    // {
    //    /*如果指定角度在起始终止角度之间，则判定指定点在指定角度*/
    //    if (point_angle >= start && point_angle <= end)
    //    {
    //        return 1;
    //    }
    // }
    // else           //起始角度大于于终止角度的情况
    // {
    //    /*如果指定角度大于起始角度或者小于终止角度，则判定指定点在指定角度*/
    //    if (point_angle >= start || point_angle <= end)
    //    {
    //        return 1;
    //    }
    // }
    // return 0;  

    return start < end ?
        (start < point_angle && point_angle < end):
        (start > point_angle || point_angle > end);
}

#define DRAW_OFFSET_POINT(offsetx, offsety) \
    do{\
        point.x = handle->center.x + (offsetx);\
        point.y = handle->center.y + (offsety);\
        CCGraphic_draw_point(handler, &point);\
    }while(0)

#define DRAW_IF_IN(offsetx, offsety) \
    do{\
        if (__pvt_is_in_angle((offsetx), (offsety), start_angle, end_angle))    {\
            DRAW_OFFSET_POINT(offsetx, offsety);\
        }\
    }while(0)   

void CCGraphic_draw_arc(
    CCDeviceHandler* handler,
    CCGraphic_Arc* handle
)
{
    /*此函数借用Bresenham算法画圆的方法*/ 
    int16_t x = 0;
    int16_t y = handle->radius;
    int16_t d = 1 - y;

    CCGraphic_Point point;
    const int16_t start_angle = handle->start_degree;
    const int16_t end_angle = handle->end_degree;
    /*在画圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
    DRAW_IF_IN(x, y);
    DRAW_IF_IN(-x, -y);
    DRAW_IF_IN(y, x);
    DRAW_IF_IN(-y, -x);
    
    while (x < y)        //遍历X轴的每个点
    {
        x ++;
        if (d < 0)       //下一个点在当前点东方
        {
            d += 2 * x + 1;
        }
        else            //下一个点在当前点东南方
        {
            y --;
            d += 2 * (x - y) + 1;
        }
        
        /*在画圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
        DRAW_IF_IN(x, y);
        DRAW_IF_IN(y, x);
        DRAW_IF_IN(-x, -y);
        DRAW_IF_IN(-y, -x);
        DRAW_IF_IN(x, -y);
        DRAW_IF_IN(y, -x);
        DRAW_IF_IN(-x, y);
        DRAW_IF_IN(-y, x);
    }
}

void CCGraphic_drawfilled_arc(
    CCDeviceHandler* handler,
    CCGraphic_Arc* handle
)
{
    /*此函数借用Bresenham算法画圆的方法*/ 
    int16_t x = 0;
    int16_t y = handle->radius;
    int16_t d = 1 - y;

    CCGraphic_Point point;
    const int16_t start_angle = handle->start_degree;
    const int16_t end_angle = handle->end_degree;
    point.x = x;
    point.y = y;
    
    /*在画圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
    DRAW_IF_IN(x, y);
    DRAW_IF_IN(-x, -y);
    DRAW_IF_IN(y, x);
    DRAW_IF_IN(-y, -x);

    /*遍历起始点Y坐标*/
    for (int16_t j = -y; j < y; j ++)
    {
        /*在填充圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
        DRAW_IF_IN(0, j);
    }
    
    while (x < y)        //遍历X轴的每个点
    {
        x ++;
        if (d < 0)       //下一个点在当前点东方
        {
            d += 2 * x + 1;
        }
        else            //下一个点在当前点东南方
        {
            y --;
            d += 2 * (x - y) + 1;
        }
        
        /*在画圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
        DRAW_IF_IN(x, y);
        DRAW_IF_IN(y, x);
        DRAW_IF_IN(-x, -y);
        DRAW_IF_IN(-y, -x);
        DRAW_IF_IN(x, -y);
        DRAW_IF_IN(y, -x);
        DRAW_IF_IN(-x, y);
        DRAW_IF_IN(-y, x);

        /*遍历中间部分*/
        for (int16_t j = -y; j < y; j ++)
        {
                /*在填充圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
            DRAW_IF_IN(x, j);
            DRAW_IF_IN(-x, j);
        }
            
        /*遍历两侧部分*/
        for (int16_t j = -x; j < x; j ++)
        {
            /*在填充圆的每个点时，判断指定点是否在指定角度内，在，则画点，不在，则不做处理*/
            DRAW_IF_IN(y, j);
            DRAW_IF_IN(-y, j);
        }
    }
}

#undef DRAW_OFFSET_POINT
#undef DRAW_IF_IN

#include "Graphic/base/CCGraphic_Ellipse/CCGraphic_Ellipse.h"

void CCGraphic_init_ellipse(
    CCGraphic_Ellipse*          handle, 
    CCGraphic_Point             center,
    PointBaseType               X_Radius,
    PointBaseType               Y_Radius 
)
{
    handle->center = center;
    handle->X_Radius = X_Radius;
    handle->Y_Radius = Y_Radius;
}

#define DRAW_OFFSET_POINT(offsetx, offsety) \
    do{\
        point.x = ellipse->center.x + (offsetx);\
        point.y = ellipse->center.y + (offsety);\
        CCGraphic_draw_point(handler, &point);\
    }while(0)

#define SQUARE(X) ((X) * (X))

void CCGraphic_draw_ellipse(
    CCDeviceHandler* handler,
    CCGraphic_Ellipse* ellipse
)
{
    const int16_t x_radius = ellipse->X_Radius;
    const int16_t y_radius = ellipse->Y_Radius;

    // Bresenham's Ellipse Algorithm to avoid costly floating point calculations
    // Reference: https://blog.csdn.net/myf_666/article/details/128167392

    int16_t x = 0;
    int16_t y = y_radius;
    const int16_t y_radius_square = SQUARE(y_radius);
    const int16_t x_radius_square = SQUARE(x_radius);

    // Initial decision variable for the first region of the ellipse
    float d1 = y_radius_square + x_radius_square * (-y_radius + 0.5);

    // Draw initial points on the ellipse (4 points due to symmetry)
    CCGraphic_Point point;
    DRAW_OFFSET_POINT(x, y);
    DRAW_OFFSET_POINT(-x, -y);
    DRAW_OFFSET_POINT(-x, y);
    DRAW_OFFSET_POINT(x, -y);

    // Draw the middle part of the ellipse (first region)
    while (y_radius_square * (x + 1) < x_radius_square * (y - 0.5)) {
        if (d1 <= 0) {  // Next point is to the east of the current point
            d1 += y_radius_square * (2 * x + 3);
        } else {  // Next point is southeast of the current point
            d1 += y_radius_square * (2 * x + 3) + x_radius_square * (-2 * y + 2);
            y--;
        }
        x++;

        // Draw ellipse arc for each point in the current region
        DRAW_OFFSET_POINT(x, y);
        DRAW_OFFSET_POINT(-x, -y);
        DRAW_OFFSET_POINT(-x, y);
        DRAW_OFFSET_POINT(x, -y);
    }

    // Draw the two sides of the ellipse (second region)
    float d2 = SQUARE(y_radius * (x + 0.5)) + SQUARE(x_radius * (y - 1)) - x_radius_square * y_radius_square;

    while (y > 0) {
        if (d2 <= 0) {  // Next point is to the east of the current point
            d2 += y_radius_square * (2 * x + 2) + x_radius_square * (-2 * y + 3);
            x++;
        } else {  // Next point is southeast of the current point
            d2 += x_radius_square * (-2 * y + 3);
        }
        y--;

        // Draw ellipse arc for each point on the sides
        DRAW_OFFSET_POINT(x, y);
        DRAW_OFFSET_POINT(-x, -y);
        DRAW_OFFSET_POINT(-x, y);
        DRAW_OFFSET_POINT(x, -y);
    }
}

void CCGraphic_drawfilled_ellipse(
    CCDeviceHandler* handler,
    CCGraphic_Ellipse* ellipse
)
{
    const int16_t x_radius = ellipse->X_Radius;
    const int16_t y_radius = ellipse->Y_Radius;

    // Bresenham's Ellipse Algorithm to avoid costly floating point calculations
    // Reference: https://blog.csdn.net/myf_666/article/details/128167392

    int16_t x = 0;
    int16_t y = y_radius;
    const int16_t y_radius_square = SQUARE(y_radius);
    const int16_t x_radius_square = SQUARE(x_radius);

    // Initial decision variable for the first region of the ellipse
    float d1 = y_radius_square + x_radius_square * (-y_radius + 0.5);
    CCGraphic_Point point;
    // Fill the ellipse by drawing vertical lines in the specified range (filled area)
    for (int16_t j = -y; j < y; j++) {
        // Draw vertical lines to fill the area of the ellipse
        DRAW_OFFSET_POINT(0, j);
        DRAW_OFFSET_POINT(0, j);
    }

    // Draw initial points on the ellipse (4 points due to symmetry)
    DRAW_OFFSET_POINT(x, y);
    DRAW_OFFSET_POINT(-x, -y);
    DRAW_OFFSET_POINT(-x, y);
    DRAW_OFFSET_POINT(x, -y);

    // Draw the middle part of the ellipse (first region)
    while (y_radius_square * (x + 1) < x_radius_square * (y - 0.5)) {
        if (d1 <= 0) {  // Next point is to the east of the current point
            d1 += y_radius_square * (2 * x + 3);
        } else {  // Next point is southeast of the current point
            d1 += y_radius_square * (2 * x + 3) + x_radius_square * (-2 * y + 2);
            y--;
        }
        x++;

        // Fill the ellipse by drawing vertical lines in the current range
        for (int16_t j = -y; j < y; j++) {
            DRAW_OFFSET_POINT(x, j);
            DRAW_OFFSET_POINT(-x, j);
        }

        // Draw ellipse arc for each point in the current region
        DRAW_OFFSET_POINT(x, y);
        DRAW_OFFSET_POINT(-x, -y);
        DRAW_OFFSET_POINT(-x, y);
        DRAW_OFFSET_POINT(x, -y);
    }

    // Draw the two sides of the ellipse (second region)
    float d2 = SQUARE(y_radius * (x + 0.5)) + SQUARE(x_radius * (y - 1)) - x_radius_square * y_radius_square;

    while (y > 0) {
        if (d2 <= 0) {  // Next point is to the east of the current point
            d2 += y_radius_square * (2 * x + 2) + x_radius_square * (-2 * y + 3);
            x++;
        } else {  // Next point is southeast of the current point
            d2 += x_radius_square * (-2 * y + 3);
        }
        y--;

        // Fill the ellipse by drawing vertical lines in the current range
        for (int16_t j = -y; j < y; j++) {
            DRAW_OFFSET_POINT(x, j);
            DRAW_OFFSET_POINT(-x, j);
        }

        // Draw ellipse arc for each point on the sides
        DRAW_OFFSET_POINT(x, y);
        DRAW_OFFSET_POINT(-x, -y);
        DRAW_OFFSET_POINT(-x, y);
        DRAW_OFFSET_POINT(x, -y);
    }
}

#undef DRAW_OFFSET_POINT
#undef SQUARE

#include "Graphic/base/CCGraphic_Circle/CCGraphic_Circle.h"
#include "Graphic/CCGraphic_device_adapter.h"
#include "Graphic/common/CCGraphic_Utils.h"

void CCGraphic_init_circle(
    CCGraphic_Circle* circle, CCGraphic_Point c, uint8_t radius)
{
    circle->center = c;
    circle->radius = radius;
}

#define DRAW_OFFSET_POINT(point, offsetx, offsety) \
    do { \
        point.x = circle->center.x + (offsetx); \
        point.y = circle->center.y + (offsety); \
        CCGraphic_draw_point(handler, &point);}while(0)

void CCGraphic_draw_circle(
    CCDeviceHandler* handler, CCGraphic_Circle* circle)
{
    /*参考文档：https://www.cs.montana.edu/courses/spring2009/425/dslectures/Bresenham.pdf*/
    /*参考教程：https://www.bilibili.com/video/BV1VM4y1u7wJ*/
    CCGraphic_Point p;
    int16_t d = 1 - circle->radius;
    int16_t x = 0;
    int16_t y = circle->radius;

    DRAW_OFFSET_POINT(p, x, y);
    DRAW_OFFSET_POINT(p, -x, -y);
    DRAW_OFFSET_POINT(p, y, x);
    DRAW_OFFSET_POINT(p, -y, -x);

    while(x < y)
    {
        x++;
        if(d < 0){ d += 2 * x + 1;}
        else {y--; d += 2 * (x - y) + 1;}
        DRAW_OFFSET_POINT(p, x, y);
        DRAW_OFFSET_POINT(p, y, x);
        DRAW_OFFSET_POINT(p, -x, -y);
        DRAW_OFFSET_POINT(p, -y, -x);
        DRAW_OFFSET_POINT(p, x, -y);
        DRAW_OFFSET_POINT(p, y, -x);
        DRAW_OFFSET_POINT(p, -x, y);
        DRAW_OFFSET_POINT(p, -y, x);            
    }
}

void CCGraphic_drawfilled_circle(CCDeviceHandler* handler, CCGraphic_Circle* circle)
{
    CCGraphic_Point p;
    int16_t d = 1 - circle->radius;
    int16_t x = 0;
    int16_t y = circle->radius;

    DRAW_OFFSET_POINT(p, x, y);
    DRAW_OFFSET_POINT(p, -x, -y);
    DRAW_OFFSET_POINT(p, y, x);
    DRAW_OFFSET_POINT(p, -y, -x);

    for(int16_t i = -y; i < y; i++)
        DRAW_OFFSET_POINT(p, 0, i);

    while(x < y)
    {
        x++;
        if(d < 0){ d += 2 * x + 1;}
        else {y--; d += 2 * (x - y) + 1;}
        DRAW_OFFSET_POINT(p, x, y);
        DRAW_OFFSET_POINT(p, y, x);
        DRAW_OFFSET_POINT(p, -x, -y);
        DRAW_OFFSET_POINT(p, -y, -x);
        DRAW_OFFSET_POINT(p, x, -y);
        DRAW_OFFSET_POINT(p, y, -x);
        DRAW_OFFSET_POINT(p, -x, y);
        DRAW_OFFSET_POINT(p, -y, x);   
        for(int16_t i = -y; i < y; i++)
        {
            DRAW_OFFSET_POINT(p, x, i);
            DRAW_OFFSET_POINT(p, -x, i);  
        }
        for(int16_t i = -x; i < x; i++)
        {
            DRAW_OFFSET_POINT(p, y, i);
            DRAW_OFFSET_POINT(p, -y, i);  
        }              
    }    
}

#undef DRAW_OFFSET_POINT
```

​现在我们可以上测试了

### 继续我们的测试

```text
#include "Test/GraphicTest/graphic_test.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"
#include "Graphic/base/CCGraphic_Line/CCGraphic_Line.h"
#include "Graphic/base/CCGraphic_Circle/CCGraphic_Circle.h"
#include "Graphic/base/CCGraphic_Rectangle/CCGraphic_Rectangle.h"
#include "Graphic/base/CCGraphic_Triangle/CCGraphic_Triangle.h"
#include "Graphic/base/CCGraphic_Ellipse/CCGraphic_Ellipse.h"
#include "Graphic/base/CCGraphic_Arc/CCGraphic_Arc.h"

void on_test_draw_points(CCDeviceHandler* handle)
{
    CCGraphic_Point point;
    CCGraphic_init_point(&point, 0, 0);
    for(uint8_t i = 0; i < 20; i++)
    {
        point.x = i;
        point.y = i * 2;
        CCGraphic_draw_point(handle, &point);
    }
    handle->operations.update_device_function(handle);
}

void on_test_draw_line(CCDeviceHandler* handle)
{
    CCGraphic_Line  l;
    CCGraphic_Point pleft;
    CCGraphic_Point pright;
    // try vertical
    pleft.x     = 5;
    pleft.y     = 0;
    pright.x    = pleft.x;
    pright.y    = 63;

    CCGraphic_init_line(&l, pleft, pright);
    CCGraphic_draw_line(handle, &l);

    // try horizontal
    pleft.x     = 0;
    pleft.y     = 5;
    pright.x    = 120;
    pright.y    = pleft.y;

    CCGraphic_init_line(&l, pleft, pright);
    CCGraphic_draw_line(handle, &l);

    // try different
    pleft.x     = 0;
    pleft.y     = 10;
    pright.x    = 105;
    pright.y    = 63;

    CCGraphic_init_line(&l, pleft, pright);
    CCGraphic_draw_line(handle, &l);
    handle->operations.update_device_function(handle);
}

void on_test_draw_circle(CCDeviceHandler* handle)
{
    CCGraphic_Circle c;
    CCGraphic_Point p;
    p.x = 64;
    p.y = 32;
    CCGraphic_init_circle(&c, p, 10);
    CCGraphic_drawfilled_circle(handle, &c);

    p.x = 10;
    p.y = 32;
    CCGraphic_init_circle(&c, p, 5);
    CCGraphic_draw_circle(handle, &c);
    handle->operations.update_device_function(handle);
}

void on_test_draw_rectangle(CCDeviceHandler* handle)
{
    CCGraphic_Rectangle rect;
    CCGraphic_Point     tl;
    CCGraphic_Point     br;

    tl.x = 5;
    tl.y = 5;

    br.x = 20;
    br.y = 20;

    CCGraphic_init_rectangle(&rect, tl, br);
    CCGraphic_draw_rectangle(handle, &rect);

    tl.x = 21;
    tl.y = 21;

    br.x = 50;
    br.y = 50;    
    CCGraphic_init_rectangle(&rect, tl, br);
    CCGraphic_drawfilled_rectangle(handle, &rect);
    handle->operations.update_device_function(handle);
}

void on_test_draw_triangle(CCDeviceHandler* handle)
{
    CCGraphic_Triangle  triangle;
    CCGraphic_Point     p1;
    CCGraphic_Point     p2;
    CCGraphic_Point     p3;

    p1.x = 10;
    p1.y = 10;

    p2.x = 15;
    p2.y = 5;

    p3.x = 80;
    p3.y = 40;

    CCGraphic_init_triangle(&triangle, p1, p3, p2);
    CCGraphic_drawfilled_triangle(handle, &triangle);
    handle->operations.update_device_function(handle);
}

void on_test_draw_ellipse(CCDeviceHandler* handle)
{
    CCGraphic_Ellipse ellipse;
    CCGraphic_Point p;
    p.x = 20;
    p.y = 32;

    CCGraphic_init_ellipse(&ellipse, p, 10, 30);
    CCGraphic_draw_ellipse(handle, &ellipse);

    p.x = 80;
    p.y = 32;
    CCGraphic_init_ellipse(&ellipse, p, 40, 30);
    CCGraphic_drawfilled_ellipse(handle, &ellipse);
    handle->operations.update_device_function(handle);
}

void on_test_draw_arc(CCDeviceHandler* handle)
{
    CCGraphic_Arc arc;
    CCGraphic_Point p;
    p.x = 64;
    p.y = 32;
    CCGraphic_init_CCGraphic_Arc(&arc, p, 40, -20, 40);
    CCGraphic_draw_arc(handle, &arc);
    handle->operations.update_device_function(handle);
}
```

​在main.c中就可以这样调用

```text
on_test_draw_points(handler);
  HAL_Delay(1000);
  on_test_draw_line(handler);
  HAL_Delay(1000);
  on_test_draw_circle(handler);
  HAL_Delay(1000);
  on_test_draw_rectangle(handler);
  HAL_Delay(1000);
  on_test_draw_triangle(handler);
  HAL_Delay(1000);
  on_test_draw_ellipse(handler);
  HAL_Delay(1000);
  on_test_draw_arc(handler);
```

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架（基础组件实现）

## 基础组件实现

​我们现在离手搓一个动态的多级菜单越来越近了。终于！我们来到了最基础的组件实现，我们现在搓的东西的代码库放到了：[MCU_Libs/OLED/library/Graphic/widgets/base at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/Graphic/widgets/base)当中，也就是手搓图像显示和文字显示。如果你对这篇博客所属的集合有任何疑问，可以到[从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架-CSDN博客](https://blog.csdn.net/charlie114514191/article/details/145397231)阅读。

### 如何将图像和文字显示到OLED上

​**三个字：画出来！**带上一个KeysKing大跌手搓的取码地址：[波特律动LED字模生成器 (baud-dance.com)](https://led.baud-dance.com/)，实际上，你的悟性足够高，已经可以离开这篇博客自己继续手搓了。

​好吧，你继续往下看了，那我就详细的好好说明。

#### 如何绘制图像

​绘制图像之前，我们还要遵循老步骤，思考一下如何设计我们的抽象。

​我们如何描述一个给定的图像呢？我们可能着急于描述这个图像表达了什么，也就是图像的资源，在OLED中，我们习惯于阐述为一个字节的数组，这个数组描述了我们的图像，只要把它传递上去，一个图像就显示出来我们可以看了。

​但是还是有问题：你这个图像放到哪里呢？画的要多大呢？这就是我们需要设计一个结构体抽象的原因了。请看VCR：

```c
typedef struct __CCGraphic_Image{
    CCGraphic_Point point;
    CCGraphic_Size  image_size;
    uint8_t*        sources_register;
}CCGraphic_Image;
```

​关于CCGraphic_Size，并不复杂，可以到[MCU_Libs/OLED/library/Graphic/widgets/common/CCGraphic_Size at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/Graphic/widgets/common/CCGraphic_Size)中看到源码，实际上就是宽和高的一个封装，没什么大不了的。

​此外，我们对图像的操作就是绘制了

```text
void CCGraphicWidget_init_image(
    CCGraphic_Image*    image,
    CCGraphic_Point     tl_point,
    CCGraphic_Size      image_size,
    uint8_t*      sources_register
);

void CCGraphicWidget_draw_image(
    CCDeviceHandler*    handler,
    CCGraphic_Image*    image
);
```

​出乎你意料的是。绘制图像远远比你想象的简单的多

```text
#include "Graphic/widgets/base/CCGraphic_Image/CCGraphic_Image.h"
#include "Graphic/CCGraphic_device_adapter.h"
void CCGraphicWidget_init_image(
    CCGraphic_Image*    image,
    CCGraphic_Point     tl_point,
    CCGraphic_Size      image_size,
    uint8_t*      sources_register
)
{
    image->image_size = image_size;
    image->point = tl_point;
    image->sources_register = sources_register;
}

void CCGraphicWidget_draw_image(
    CCDeviceHandler*    handler,
    CCGraphic_Image*    image
)
{
    if(!image->sources_register) return;
    handler->operations.draw_area_device_function(
        handler, image->point.x, image->point.y,
        image->image_size.width, image->image_size.height, image->sources_register
    );
}
```

​我们直接使用设备draw_area的方法，将图像资源传递上去了。

```text
CCGraphicWidget_draw_image -> draw_area_device_function(draw_area_device_oled) -> oled_helper_draw_area
```

​你看，干净利落！完事。

#### 如何绘制文字

​现在这个事情就需要深思熟虑了，设计到文字，就必然需要考虑字体大小，以及解析字符串的问题。笔者这里没有实现UTF-8字符的打印实现，但是笔者提示你，**仍然是画出来字符**。让我们看看该咋做。

```c
typedef struct __CCGraphic_TextHandle{
    char*               sources_borrowed;       // 这个就是所持有的字体资源指针
    CCGraphic_Point     tl_point;               // 这个是所占有的左上角的绘制起点
    CCGraphic_Point     indexed_point;          // 这个是现在的绘制指针，表明现在我们绘制到了那个地方
    CCGraphic_Size      TexthandleSize;         // 整个Text所在的BoundingRect大小
    Ascii_Font_Size     font_size;              // 字体多大？
}CCGraphic_AsciiTextItem;
```

##### 如何获取字体？

关于ASCII字体的获取，笔者放到了附录里，值得一提的是，江科大的OLED_Data.h中对字体数组的初始化时**不严谨的，不规范的**，正确的初始化方案已经放到了附录，不再赘述。

##### 如何正确的访问字体

​C语言中，有一个著名的关键字叫extern，他随了汇编语言的关键字extern，在所属权层面上表达的同static完全相反，即这个资源的定义需要到其他文件中寻找。所以，当我们想要引用字体（这个字体被存放到了其他的C源文件中）的时候，只需要手动的extern一下，而且确保资源被正确的编译进来就OK了。

```text
extern const uint8_t ascii6x8_sources[][6];
```

##### 如何抽象字体

​很简单，虽然说正常而言只需要抽象一个`TextFont`结构体即可，但是笔者认为这里更多看重的是方法，而且，没有必要对用户暴露一个Font结构体，选择结构体更加不如暴露的是一个枚举和公开的方法。

```text
#ifndef CCGraphic_TextConfig_H
#define CCGraphic_TextConfig_H
#include "Graphic/config/CCGraphic_config.h"
#include "Graphic/CCGraphic_common.h"
#include "Graphic/widgets/common/CCGraphic_Size/CCGraphic_Size.h"
/*
    current version we only support
    6x8 and 8x16. to register more, u should
    provide the source and implement the functions
*/
typedef enum {
#if ENABLE_ASCII_6x8_SOURCES
    ASCII_6x8,
#endif

#if ENABLE_ASCII_8x16_SOURCES
    ASCII_8x16,
#endif
    NO_ASCII_SIZE 
}Ascii_Font_Size;

typedef enum {
    Unicode_16x16
}Unicode_Font_Size;

#define UNSUPPORTIVE_FONT_SOURCE    ((void*)0)

/**
 * @brief Selects the font data array based on the specified font size.
 *
 * This function receives an `Ascii_Font_Size` value 
 * and returns a pointer to the corresponding font data array. 
 * The function helps in selecting
 * the appropriate font data for display purposes, allowing for different
 * font sizes (e.g., 8x16, 6x8, etc.).
 *
 * @param s The font size to be selected 
 *          (from the `Ascii_Font_Size` enum).
 * @param ch the character wanna display
 * @return  A pointer to the font data array corresponding to the selected font size.
 *          If an invalid font size is passed, 
 *          the function returns UNSUPPORTIVE_FONT_SOURCE.
 */
uint8_t*        __select_from_ascii_font_size(const Ascii_Font_Size s, const char ch);

CCGraphic_Size  __fetch_font_size(const Ascii_Font_Size s);

#endif
```

```yaml
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextConfig.h"

extern const uint8_t ascii8x16_sources[][16];
extern const uint8_t ascii6x8_sources[][6];

uint8_t* __select_from_ascii_font_size(
    const Ascii_Font_Size s, const char ch)
{
    switch(s)
    {
#if ENABLE_ASCII_6x8_SOURCES
        case ASCII_6x8:
            return (uint8_t*)(ascii6x8_sources[ch - ' ']);
#endif
#if ENABLE_ASCII_8x16_SOURCES       
        case ASCII_8x16:
            return (uint8_t*)(ascii8x16_sources[ch - ' ']);
#endif
        /* 
            To programmers, if new ascii like sources is
            registered, please implement follows
        */
        default:
            return UNSUPPORTIVE_FONT_SOURCE;
    }
}

CCGraphic_Size  __fetch_font_size(const Ascii_Font_Size s)
{
    CCGraphic_Size size = {0, 0};
    switch(s)
    {
#if ENABLE_ASCII_6x8_SOURCES
        case ASCII_6x8:
            size.height     =   8;
            size.width      =   6;
            break;
#endif

#if ENABLE_ASCII_8x16_SOURCES  
        case ASCII_8x16:
            size.height     =   16;
            size.width      =   8;
            break;
#endif
        default:
            break;
    }
    return size;
}
```

> 题外话：使用编译宏控制资源编译：GCC是一个智能的编译器，对于任何没有使用到的资源，概不参与编译，所以，对于使用GCC的编译器，只需要确保自己不额外使用其他资源，就不会将冗余的C符号纳入编译。
>
> 但还是那句话，为了确保语义更加清晰，仍然使用控制宏对资源进行编译控制和符号控制，让自己的代码语义更加的明确，是一件事半功倍的举措

##### 如何绘制字符串

​绘制字符串是一个复杂的活。但是在那之前，把杂活做了。

```text
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextItem.h"
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextConfig.h"
#include "Graphic/widgets/base/CCGraphic_Image/CCGraphic_Image.h"
#include "Graphic/CCGraphic_device_adapter.h"
#include <string.h>

/**
 * 初始化一个ASCII文本项。
 * @param item 指向CCGraphic_AsciiTextItem的指针。
 * @param tl_point 文本项的左上角起始坐标。
 * @param textHandleSize 文本项的尺寸信息（宽度和高度）。
 * @param text_size 字体大小枚举类型。
 */
void CCGraphicWidget_init_AsciiTextItem(
    CCGraphic_AsciiTextItem* item,
    CCGraphic_Point tl_point,
    CCGraphic_Size textHandleSize,
    Ascii_Font_Size text_size
)
{
    item->font_size = text_size;
    item->sources_borrowed = "";  // 初始化为空字符串，表示未设置内容。
    item->tl_point = tl_point;
    item->indexed_point = tl_point;
    item->TexthandleSize = textHandleSize;
}

/**
 * 设置ASCII文本项的内容。
 * @param item 指向CCGraphic_AsciiTextItem的指针。
 * @param text 待设置的文本内容字符串。
 */
void CCGraphicWidget_AsciiTextItem_setAsciiText(
    CCGraphic_AsciiTextItem* item,
    char* text
)
{
    item->sources_borrowed = text;
}

/**
 * 设置ASCII文本项的索引点。
 * @param item 指向CCGraphic_AsciiTextItem的指针。
 * @param p 索引点的指针。
 */
void CCGraphicWidget_AsciiTextItem_setIndexedPoint(
    CCGraphic_AsciiTextItem* item,
    CCGraphic_Point* p
)
{
    item->indexed_point = *p;
}

/**
 * 重新定位ASCII文本项。
 * @param item 指向CCGraphic_AsciiTextItem的指针。
 * @param tl_point 新的左上角起始坐标。
 * @param textHandleSize 新的尺寸信息（宽度和高度）。
 */
void CCGraphicWidget_AsciiTextItem_relocate(
    CCGraphic_AsciiTextItem* item,
    CCGraphic_Point tl_point,
    CCGraphic_Size textHandleSize
)
{
    // 这个函数的一个重要的目的就是重定位文本框，为之后的文本显示做铺垫。
    item->tl_point = tl_point;
    item->TexthandleSize = textHandleSize;
}
```

​**绘制一个字符串本身就是绘制一串字符**，掌握整个原理，事情就会变得非常简单，我们线讨论如何绘制字符本身

```text
/**
 * 绘制ASCII字符到设备。
 * @param device_handle 设备句柄。
 * @param borrowing_image 临时用于绘制的图像对象。
 * @param ch 要绘制的字符。
 * @param size 字体大小枚举类型。
 */
static void __pvt_draw_char_each(
    CCDeviceHandler* device_handle, 
    CCGraphic_Image* borrowing_image, 
    const char ch, Ascii_Font_Size size
)
{
    borrowing_image->image_size = __fetch_font_size(size);
    uint8_t* ascii = __select_from_ascii_font_size(size, ch);
    borrowing_image->sources_register = ascii;
    CCGraphicWidget_draw_image(device_handle, borrowing_image);
#if CCGraphic_TextDebug
    device_handle->operations.update_device_function(device_handle);
#endif
}
```

​我们将一个字符的字体绘制文件放置到Image中，**所以我强调：字符是画出来的**。

> 设计缺陷：注意到，我这里并没有设置绘制的位置，这是因为这件事情在上层做好了，所以我也在参变量中警示自己：整个变量是部分初始化的。

##### 绘制方案

​我们绘制的时候，更多会去在乎：是在之前的文本基础上继续绘制呢？还是换一行继续绘制，还是直接清空文本重新绘制？为了防止反复的刷新，笔者设计了三个函数完成整个工作。

​首先，设置游标点：

```text
CCGraphic_Point     indexed_point;          // 这个是现在的绘制指针，表明现在我们绘制到了那个地方
```

​整个在Text的结构体中，不由用户直接设置。

​下面，就是依赖设置：

```text
/**
 * 判断当前字符是否需要换行。
 * @param device_handle 设备句柄。
 * @param brpoint 右下角边界点。
 * @param cur_draw_p 当前绘制点的指针。
 * @param s 字体大小枚举类型。
 * @return 如果需要换行，返回非零值；否则返回零。
 */
static uint8_t inline __pvt_should_be_next_line(
    CCDeviceHandler* device_handle,
    CCGraphic_Point* brpoint,
    CCGraphic_Point* cur_draw_p, Ascii_Font_Size s 
)
{
    return cur_draw_p->x + 
        (int16_t)(1.5 * __fetch_font_size(s).width) >= brpoint->x;
}
/**
 * 计算有效的右下角点。
 * @param device_handle 设备句柄。
 * @param size 文本项的尺寸信息。
 * @param tl 文本项的左上角起始点。
 * @return 计算后的右下角点。
 */
static CCGraphic_Point inline __pvt_fetch_valid_final_point(
    CCDeviceHandler* device_handle,
    CCGraphic_Size* size, CCGraphic_Point* tl
) 
{
    CCGraphic_Point br;
    int16_t device_width = 0;
    device_handle->operations.property_function(
        device_handle, &device_width, CommonProperty_WIDTH
    );
    int16_t device_height = 0;
    device_handle->operations.property_function(
        device_handle, &device_height, CommonProperty_HEIGHT
    );
    // 上面我们获取了设备的宽高，现在我们开获取最大的合法右下角的点
    br.x = tl->x + size->width;
    br.y = tl->y + size->height;
    if(device_width < br.x) { br.x = device_width; }
    if(device_height < br.y) { br.y = device_height; }
    return br;
}
```

##### 文本绘制

​绘制文本的本质是绘图。这一点务必注意。下面的整个函数实现了自动的文本换行！

```text
/**
 * 绘制ASCII文本项。
 * @param device_handle 设备句柄，用于控制绘制设备。
 * @param item 要绘制的ASCII文本项，包含文本内容、位置及尺寸信息。
 */
void CCGraphicWidget_drawAsciiTextItem(
    CCDeviceHandler* device_handle,
    CCGraphic_AsciiTextItem* item)
{
    // 如果文本内容为空，直接返回，不进行绘制。
    if(strcmp(item->sources_borrowed, "") == 0) {
        return;
    }

    // 定义用于绘制的图像结构体。
    CCGraphic_Image handle_draw_image;

    // 初始化绘制的起始点为当前索引位置。
    CCGraphic_Point draw_tl_point = item->indexed_point;

    // 获取当前文本字体的尺寸（宽度和高度）。
    const Ascii_Font_Size font_size = item->font_size;
    const CCGraphic_Size size = __fetch_font_size(font_size);
    const SizeBaseType font_width = size.width;
    const SizeBaseType font_height = size.height;

    // 计算文本绘制区域的有效右下角点（即绘制边界）。
    CCGraphic_Point br = __pvt_fetch_valid_final_point(
        device_handle, &(item->TexthandleSize), &(item->tl_point) 
    );

    // 定义x方向和y方向的字符偏移量，用于逐字符定位绘制。
    uint8_t offseterx = 0;
    uint8_t offsetery = 0;

    // 遍历文本中的每个字符并绘制。
    for(uint8_t i = 0; item->sources_borrowed[i] != '\0'; i++) {
        // 计算当前字符的绘制位置。
        draw_tl_point.x = item->indexed_point.x + offseterx * font_width;
        draw_tl_point.y = item->indexed_point.y + offsetery * font_height;

        // 设置图像绘制的左上角点。
        handle_draw_image.point = draw_tl_point;

        // 绘制当前字符到目标设备上。
        __pvt_draw_char_each(
            device_handle, 
            &handle_draw_image, 
            item->sources_borrowed[i], 
            item->font_size
        );

        // 判断是否需要换行绘制。
        if(__pvt_should_be_next_line(device_handle, &br, &draw_tl_point, font_size)) {
            // 如果需要换行，将x偏移量归零，并增加y方向的行数。
            offseterx = 0;
            offsetery++;
            // 重置x方向的起点位置为文本的左上角点。
            item->indexed_point.x = item->tl_point.x;
        } else {
            // 否则继续绘制当前行的下一个字符。
            offseterx++;
        }
    }

    // 更新文本项的索引点位置为最后一个字符的右侧位置。
    item->indexed_point = draw_tl_point;
    item->indexed_point.x += font_width;
}
```

##### 更加方便的绘制

​当然，还可以为了之后的组件方便生成一个返回绘制点的方便函数：

```text
/**
 * 绘制ASCII文本项，并返回绘制后的点。
 * @param device_handle 设备句柄，用于控制绘制设备。
 * @param item 要绘制的ASCII文本项，包含文本内容、位置及尺寸信息。
 * @param method 文本追加方式，指示绘制后是否换行或连续追加。
 * @return 绘制后的坐标点，表示下一个绘制位置。
 */
CCGraphic_Point CCGraphicWidget_drawAsciiTextItem_with_finPoint(
    CCDeviceHandler* device_handle,
    CCGraphic_AsciiTextItem* item,
    AppendMethod method
)
{
    // 如果文本内容为空，直接返回文本的初始左上角点。
    if(strcmp(item->sources_borrowed, "") == 0) {
        return item->tl_point;
    }

    // 定义绘制图像和绘制位置。
    CCGraphic_Image handle_draw_image;
    CCGraphic_Point draw_tl_point = item->indexed_point;

    // 获取字体尺寸。
    const Ascii_Font_Size font_size = item->font_size;
    const CCGraphic_Size size = __fetch_font_size(font_size);
    const SizeBaseType font_width = size.width;
    const SizeBaseType font_height = size.height;

    // 获取有效绘制区域的右下角点。
    CCGraphic_Point br = __pvt_fetch_valid_final_point(
        device_handle, &(item->TexthandleSize), &(item->tl_point) 
    );

    // x方向和y方向的偏移量，用于字符定位。
    uint8_t offseterx = 0;
    uint8_t offsetery = 0;

    // 遍历文本中的每个字符。
    for(uint8_t i = 0; item->sources_borrowed[i] != '\0'; i++) {
        // 计算当前字符的绘制位置。
        draw_tl_point.x = item->indexed_point.x + offseterx * font_width;
        draw_tl_point.y = item->indexed_point.y + offsetery * font_height;

        // 设置图像的绘制点。
        handle_draw_image.point = draw_tl_point;

        // 绘制当前字符。
        __pvt_draw_char_each(
            device_handle, 
            &handle_draw_image, 
            item->sources_borrowed[i], 
            item->font_size
        );

        // 判断是否需要换行绘制。
        if(__pvt_should_be_next_line(device_handle, &br, &draw_tl_point, font_size)) {
            offseterx = 0; // x方向偏移归零
            offsetery++;   // y方向增加一行
            item->indexed_point.x = item->tl_point.x; // 重置x起点
        } else {
            offseterx++; // 继续绘制当前行的下一个字符
        }
    }

    // 更新文本项的索引点为最后一个字符位置。
    item->indexed_point = draw_tl_point;
    item->indexed_point.x += font_width;

    // 根据文本追加方式调整返回的最终坐标点。
    switch(method) {
        case CCGraphic_AsciiTextItem_AppendNextLine:
            // 追加到下一行开始位置。
            draw_tl_point.x = item->tl_point.x;
            draw_tl_point.y += font_height;
            break;
        case CCGraphic_AsciiTextItem_AppendContinously:
            // 继续追加到同一行的下一个位置。
            draw_tl_point.x += font_width;
            break;
        default:
            break;
    }

    // 返回绘制完成后的坐标点。
    return draw_tl_point;
}

/**
 * 获取当前文本项的附加点（追加位置）。
 * @param item ASCII文本项。
 * @return 当前索引位置坐标点。
 */
CCGraphic_Point CCGraphicWidget_AsciiTextItem_on_append_point(CCGraphic_AsciiTextItem* item)
{
    return item->indexed_point;
}

/**
 * 获取文本项换行后的新行起点。
 * @param item ASCII文本项。
 * @return 新行的起始坐标点。
 */
CCGraphic_Point CCGraphicWidget_AsciiTextItem_on_newLine_point(CCGraphic_AsciiTextItem* item)
{
    CCGraphic_Point draw_tl_point;
    draw_tl_point.x = item->tl_point.x;
    const CCGraphic_Size size = __fetch_font_size(item->font_size);
    draw_tl_point.y = item->indexed_point.y + size.height;
    return draw_tl_point;    
}
```

> 为什么要给函数标记为inline
>
> 对于现代的编译器，inline只是起到了一种劝说的作用，他将调用转换为直接插入函数的汇编代码，节约了流水线刷新和代码跳转，这样来看，是一个不错的关键字，但是，一个过于庞大的函数标记为inline是一个无效的举措（几乎没有节约开销，所以编译器有的时候不会理睬，对于GCC，尝试使用force_inline标记符强制内联），现代的inline更加像是一种允许重复定义的关键字（因为他直接将汇编代码插入到了调用者上，符号直接被替换消失了）

## 字体附录

或者，你可以访问Github地址：[MCU_Libs/OLED/library/Graphic/resources/default at main · Charliechen114514/MCU_Libs (github.com)](https://github.com/Charliechen114514/MCU_Libs/tree/main/OLED/library/Graphic/resources/default)

### ascii 6x8字体

```text
#include "Graphic/CCGraphic_common.h"
#include "Graphic/config/CCGraphic_config.h"
//  This is an array of font data for a 
//  6x8 OLED display using 6x8 pixel font representation.
//  Each character in this font set is defined by an 
//  6x8 pixel matrix (8 pixels wide, 16 pixels high).

/* 
    sources should be externed copy this for 
    the usage in application level
*/

// ---------------------------------------------
// extern const uint8_t ascii6x8_sources[][6];
// ---------------------------------------------
#if ENABLE_ASCII_6x8_SOURCES
const uint8_t ascii6x8_sources[][6] = 
{
    {0x00,0x00,0x00,0x00,0x00,0x00}, // 0
    {0x00,0x00,0x00,0x2F,0x00,0x00}, // ! 1
    {0x00,0x00,0x07,0x00,0x07,0x00}, // " 2
    {0x00,0x14,0x7F,0x14,0x7F,0x14}, // # 3
    {0x00,0x24,0x2A,0x7F,0x2A,0x12}, // $ 4
    {0x00,0x23,0x13,0x08,0x64,0x62}, // % 5
    {0x00,0x36,0x49,0x55,0x22,0x50}, // & 6
    {0x00,0x00,0x00,0x07,0x00,0x00}, // ' 7
    {0x00,0x00,0x1C,0x22,0x41,0x00}, // ( 8
    {0x00,0x00,0x41,0x22,0x1C,0x00}, // ) 9
    {0x00,0x14,0x08,0x3E,0x08,0x14}, // * 10
    {0x00,0x08,0x08,0x3E,0x08,0x08}, // + 11
    {0x00,0x00,0x00,0xA0,0x60,0x00}, // , 12
    {0x00,0x08,0x08,0x08,0x08,0x08}, // - 13
    {0x00,0x00,0x60,0x60,0x00,0x00}, // . 14
    {0x00,0x20,0x10,0x08,0x04,0x02}, // / 15
    {0x00,0x3E,0x51,0x49,0x45,0x3E}, // 0 16
    {0x00,0x00,0x42,0x7F,0x40,0x00}, // 1 17
    {0x00,0x42,0x61,0x51,0x49,0x46}, // 2 18
    {0x00,0x21,0x41,0x45,0x4B,0x31}, // 3 19
    {0x00,0x18,0x14,0x12,0x7F,0x10}, // 4 20
    {0x00,0x27,0x45,0x45,0x45,0x39}, // 5 21
    {0x00,0x3C,0x4A,0x49,0x49,0x30}, // 6 22
    {0x00,0x01,0x71,0x09,0x05,0x03}, // 7 23
    {0x00,0x36,0x49,0x49,0x49,0x36}, // 8 24
    {0x00,0x06,0x49,0x49,0x29,0x1E}, // 9 25
    {0x00,0x00,0x36,0x36,0x00,0x00}, // : 26
    {0x00,0x00,0x56,0x36,0x00,0x00}, // ; 27
    {0x00,0x08,0x14,0x22,0x41,0x00}, // < 28
    {0x00,0x14,0x14,0x14,0x14,0x14}, // = 29
    {0x00,0x00,0x41,0x22,0x14,0x08}, // > 30
    {0x00,0x02,0x01,0x51,0x09,0x06}, // ? 31
    {0x00,0x3E,0x49,0x55,0x59,0x2E}, // @ 32
    {0x00,0x7C,0x12,0x11,0x12,0x7C}, // A 33
    {0x00,0x7F,0x49,0x49,0x49,0x36}, // B 34
    {0x00,0x3E,0x41,0x41,0x41,0x22}, // C 35
    {0x00,0x7F,0x41,0x41,0x22,0x1C}, // D 36
    {0x00,0x7F,0x49,0x49,0x49,0x41}, // E 37
    {0x00,0x7F,0x09,0x09,0x09,0x01}, // F 38
    {0x00,0x3E,0x41,0x49,0x49,0x7A}, // G 39
    {0x00,0x7F,0x08,0x08,0x08,0x7F}, // H 40
    {0x00,0x00,0x41,0x7F,0x41,0x00}, // I 41
    {0x00,0x20,0x40,0x41,0x3F,0x01}, // J 42
    {0x00,0x7F,0x08,0x14,0x22,0x41}, // K 43
    {0x00,0x7F,0x40,0x40,0x40,0x40}, // L 44
    {0x00,0x7F,0x02,0x0C,0x02,0x7F}, // M 45
    {0x00,0x7F,0x04,0x08,0x10,0x7F}, // N 46
    {0x00,0x3E,0x41,0x41,0x41,0x3E}, // O 47
    {0x00,0x7F,0x09,0x09,0x09,0x06}, // P 48
    {0x00,0x3E,0x41,0x51,0x21,0x5E}, // Q 49
    {0x00,0x7F,0x09,0x19,0x29,0x46}, // R 50
    {0x00,0x46,0x49,0x49,0x49,0x31}, // S 51
    {0x00,0x01,0x01,0x7F,0x01,0x01}, // T 52
    {0x00,0x3F,0x40,0x40,0x40,0x3F}, // U 53
    {0x00,0x1F,0x20,0x40,0x20,0x1F}, // V 54
    {0x00,0x3F,0x40,0x38,0x40,0x3F}, // W 55
    {0x00,0x63,0x14,0x08,0x14,0x63}, // X 56
    {0x00,0x07,0x08,0x70,0x08,0x07}, // Y 57
    {0x00,0x61,0x51,0x49,0x45,0x43}, // Z 58
    {0x00,0x00,0x7F,0x41,0x41,0x00}, // [ 59
    {0x00,0x02,0x04,0x08,0x10,0x20}, // \ 60
    {0x00,0x00,0x41,0x41,0x7F,0x00}, // ] 61
    {0x00,0x04,0x02,0x01,0x02,0x04}, // ^ 62
    {0x00,0x40,0x40,0x40,0x40,0x40}, // _ 63
    {0x00,0x00,0x01,0x02,0x04,0x00}, // ` 64
    {0x00,0x20,0x54,0x54,0x54,0x78}, // a 65
    {0x00,0x7F,0x48,0x44,0x44,0x38}, // b 66
    {0x00,0x38,0x44,0x44,0x44,0x20}, // c 67
    {0x00,0x38,0x44,0x44,0x48,0x7F}, // d 68
    {0x00,0x38,0x54,0x54,0x54,0x18}, // e 69
    {0x00,0x08,0x7E,0x09,0x01,0x02}, // f 70
    {0x00,0x18,0xA4,0xA4,0xA4,0x7C}, // g 71
    {0x00,0x7F,0x08,0x04,0x04,0x78}, // h 72
    {0x00,0x00,0x44,0x7D,0x40,0x00}, // i 73
    {0x00,0x40,0x80,0x84,0x7D,0x00}, // j 74
    {0x00,0x7F,0x10,0x28,0x44,0x00}, // k 75
    {0x00,0x00,0x41,0x7F,0x40,0x00}, // l 76
    {0x00,0x7C,0x04,0x18,0x04,0x78}, // m 77
    {0x00,0x7C,0x08,0x04,0x04,0x78}, // n 78
    {0x00,0x38,0x44,0x44,0x44,0x38}, // o 79
    {0x00,0xFC,0x24,0x24,0x24,0x18}, // p 80
    {0x00,0x18,0x24,0x24,0x18,0xFC}, // q 81
    {0x00,0x7C,0x08,0x04,0x04,0x08}, // r 82
    {0x00,0x48,0x54,0x54,0x54,0x20}, // s 83
    {0x00,0x04,0x3F,0x44,0x40,0x20}, // t 84
    {0x00,0x3C,0x40,0x40,0x20,0x7C}, // u 85
    {0x00,0x1C,0x20,0x40,0x20,0x1C}, // v 86
    {0x00,0x3C,0x40,0x30,0x40,0x3C}, // w 87
    {0x00,0x44,0x28,0x10,0x28,0x44}, // x 88
    {0x00,0x1C,0xA0,0xA0,0xA0,0x7C}, // y 89
    {0x00,0x44,0x64,0x54,0x4C,0x44}, // z 90
    {0x00,0x00,0x08,0x7F,0x41,0x00}, // { 91
    {0x00,0x00,0x00,0x7F,0x00,0x00}, // | 92
    {0x00,0x00,0x41,0x7F,0x08,0x00}, // } 93
    {0x00,0x08,0x04,0x08,0x10,0x08}, // ~ 94
};
#endif
```

### ascii 8 x 16字体

```text
#include "Graphic/CCGraphic_common.h"
#include "Graphic/config/CCGraphic_config.h"
//  This is an array of font data for a 
//  8x16 OLED display using 8x16 pixel font representation.
//  Each character in this font set is defined by an 
//  8x16 pixel matrix (8 pixels wide, 16 pixels high).

/* 
    sources should be externed copy this for 
    the usage in application level
*/

// ---------------------------------------------
// extern const uint8_t ascii8x16_sources[][16];
// ---------------------------------------------
#if ENABLE_ASCII_8x16_SOURCES
const uint8_t ascii8x16_sources[][16] =
{
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},//   0
    {0x00,0x00,0x00,0xF8,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x33,0x30,0x00,0x00,0x00},// ! 1
    {0x00,0x16,0x0E,0x00,0x16,0x0E,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},// " 2
    {0x40,0xC0,0x78,0x40,0xC0,0x78,0x40,0x00,
    0x04,0x3F,0x04,0x04,0x3F,0x04,0x04,0x00},// # 3
    {0x00,0x70,0x88,0xFC,0x08,0x30,0x00,0x00,
    0x00,0x18,0x20,0xFF,0x21,0x1E,0x00,0x00},// $ 4
    {0xF0,0x08,0xF0,0x00,0xE0,0x18,0x00,0x00,
    0x00,0x21,0x1C,0x03,0x1E,0x21,0x1E,0x00},// % 5
    {0x00,0xF0,0x08,0x88,0x70,0x00,0x00,0x00,
    0x1E,0x21,0x23,0x24,0x19,0x27,0x21,0x10},// & 6
    {0x00,0x00,0x00,0x16,0x0E,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},// ' 7
    {0x00,0x00,0x00,0xE0,0x18,0x04,0x02,0x00,
    0x00,0x00,0x00,0x07,0x18,0x20,0x40,0x00},// ( 8
    {0x00,0x02,0x04,0x18,0xE0,0x00,0x00,0x00,
    0x00,0x40,0x20,0x18,0x07,0x00,0x00,0x00},// ) 9
    {0x40,0x40,0x80,0xF0,0x80,0x40,0x40,0x00,
    0x02,0x02,0x01,0x0F,0x01,0x02,0x02,0x00},// * 10
    {0x00,0x00,0x00,0xF0,0x00,0x00,0x00,0x00,
    0x01,0x01,0x01,0x1F,0x01,0x01,0x01,0x00},// + 11
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0xB0,0x70,0x00,0x00,0x00,0x00,0x00},// , 12
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x01,0x01,0x01,0x01,0x01,0x01,0x01},// - 13
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x30,0x30,0x00,0x00,0x00,0x00,0x00},// . 14
    {0x00,0x00,0x00,0x00,0x80,0x60,0x18,0x04,
    0x00,0x60,0x18,0x06,0x01,0x00,0x00,0x00},// / 15
    {0x00,0xE0,0x10,0x08,0x08,0x10,0xE0,0x00,
    0x00,0x0F,0x10,0x20,0x20,0x10,0x0F,0x00},// 0 16
    {0x00,0x10,0x10,0xF8,0x00,0x00,0x00,0x00,
    0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00},// 1 17
    {0x00,0x70,0x08,0x08,0x08,0x88,0x70,0x00,
    0x00,0x30,0x28,0x24,0x22,0x21,0x30,0x00},// 2 18
    {0x00,0x30,0x08,0x88,0x88,0x48,0x30,0x00,
    0x00,0x18,0x20,0x20,0x20,0x11,0x0E,0x00},// 3 19
    {0x00,0x00,0xC0,0x20,0x10,0xF8,0x00,0x00,
    0x00,0x07,0x04,0x24,0x24,0x3F,0x24,0x00},// 4 20
    {0x00,0xF8,0x08,0x88,0x88,0x08,0x08,0x00,
    0x00,0x19,0x21,0x20,0x20,0x11,0x0E,0x00},// 5 21
    {0x00,0xE0,0x10,0x88,0x88,0x18,0x00,0x00,
    0x00,0x0F,0x11,0x20,0x20,0x11,0x0E,0x00},// 6 22
    {0x00,0x38,0x08,0x08,0xC8,0x38,0x08,0x00,
    0x00,0x00,0x00,0x3F,0x00,0x00,0x00,0x00},// 7 23
    {0x00,0x70,0x88,0x08,0x08,0x88,0x70,0x00,
    0x00,0x1C,0x22,0x21,0x21,0x22,0x1C,0x00},// 8 24
    {0x00,0xE0,0x10,0x08,0x08,0x10,0xE0,0x00,
    0x00,0x00,0x31,0x22,0x22,0x11,0x0F,0x00},// 9 25
    {0x00,0x00,0x00,0xC0,0xC0,0x00,0x00,0x00,
    0x00,0x00,0x00,0x30,0x30,0x00,0x00,0x00},// : 26
    {0x00,0x00,0x00,0xC0,0xC0,0x00,0x00,0x00,
    0x00,0x00,0x80,0xB0,0x70,0x00,0x00,0x00},// ; 27
    {0x00,0x00,0x80,0x40,0x20,0x10,0x08,0x00,
    0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x00},// < 28
    {0x40,0x40,0x40,0x40,0x40,0x40,0x40,0x00,
    0x04,0x04,0x04,0x04,0x04,0x04,0x04,0x00},// = 29
    {0x00,0x08,0x10,0x20,0x40,0x80,0x00,0x00,
    0x00,0x20,0x10,0x08,0x04,0x02,0x01,0x00},// > 30
    {0x00,0x70,0x48,0x08,0x08,0x08,0xF0,0x00,
    0x00,0x00,0x00,0x30,0x36,0x01,0x00,0x00},// ? 31
    {0xC0,0x30,0xC8,0x28,0xE8,0x10,0xE0,0x00,
    0x07,0x18,0x27,0x24,0x23,0x14,0x0B,0x00},// @ 32
    {0x00,0x00,0xC0,0x38,0xE0,0x00,0x00,0x00,
    0x20,0x3C,0x23,0x02,0x02,0x27,0x38,0x20},// A 33
    {0x08,0xF8,0x88,0x88,0x88,0x70,0x00,0x00,
    0x20,0x3F,0x20,0x20,0x20,0x11,0x0E,0x00},// B 34
    {0xC0,0x30,0x08,0x08,0x08,0x08,0x38,0x00,
    0x07,0x18,0x20,0x20,0x20,0x10,0x08,0x00},// C 35
    {0x08,0xF8,0x08,0x08,0x08,0x10,0xE0,0x00,
    0x20,0x3F,0x20,0x20,0x20,0x10,0x0F,0x00},// D 36
    {0x08,0xF8,0x88,0x88,0xE8,0x08,0x10,0x00,
    0x20,0x3F,0x20,0x20,0x23,0x20,0x18,0x00},// E 37
    {0x08,0xF8,0x88,0x88,0xE8,0x08,0x10,0x00,
    0x20,0x3F,0x20,0x00,0x03,0x00,0x00,0x00},// F 38
    {0xC0,0x30,0x08,0x08,0x08,0x38,0x00,0x00,
    0x07,0x18,0x20,0x20,0x22,0x1E,0x02,0x00},// G 39
    {0x08,0xF8,0x08,0x00,0x00,0x08,0xF8,0x08,
    0x20,0x3F,0x21,0x01,0x01,0x21,0x3F,0x20},// H 40
    {0x00,0x08,0x08,0xF8,0x08,0x08,0x00,0x00,
    0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00},// I 41
    {0x00,0x00,0x08,0x08,0xF8,0x08,0x08,0x00,
    0xC0,0x80,0x80,0x80,0x7F,0x00,0x00,0x00},// J 42
    {0x08,0xF8,0x88,0xC0,0x28,0x18,0x08,0x00,
    0x20,0x3F,0x20,0x01,0x26,0x38,0x20,0x00},// K 43
    {0x08,0xF8,0x08,0x00,0x00,0x00,0x00,0x00,
    0x20,0x3F,0x20,0x20,0x20,0x20,0x30,0x00},// L 44
    {0x08,0xF8,0xF8,0x00,0xF8,0xF8,0x08,0x00,
    0x20,0x3F,0x00,0x3F,0x00,0x3F,0x20,0x00},// M 45
    {0x08,0xF8,0x30,0xC0,0x00,0x08,0xF8,0x08,
    0x20,0x3F,0x20,0x00,0x07,0x18,0x3F,0x00},// N 46
    {0xE0,0x10,0x08,0x08,0x08,0x10,0xE0,0x00,
    0x0F,0x10,0x20,0x20,0x20,0x10,0x0F,0x00},// O 47
    {0x08,0xF8,0x08,0x08,0x08,0x08,0xF0,0x00,
    0x20,0x3F,0x21,0x01,0x01,0x01,0x00,0x00},// P 48
    {0xE0,0x10,0x08,0x08,0x08,0x10,0xE0,0x00,
    0x0F,0x18,0x24,0x24,0x38,0x50,0x4F,0x00},// Q 49
    {0x08,0xF8,0x88,0x88,0x88,0x88,0x70,0x00,
    0x20,0x3F,0x20,0x00,0x03,0x0C,0x30,0x20},// R 50
    {0x00,0x70,0x88,0x08,0x08,0x08,0x38,0x00,
    0x00,0x38,0x20,0x21,0x21,0x22,0x1C,0x00},// S 51
    {0x18,0x08,0x08,0xF8,0x08,0x08,0x18,0x00,
    0x00,0x00,0x20,0x3F,0x20,0x00,0x00,0x00},// T 52
    {0x08,0xF8,0x08,0x00,0x00,0x08,0xF8,0x08,
    0x00,0x1F,0x20,0x20,0x20,0x20,0x1F,0x00},// U 53
    {0x08,0x78,0x88,0x00,0x00,0xC8,0x38,0x08,
    0x00,0x00,0x07,0x38,0x0E,0x01,0x00,0x00},// V 54
    {0xF8,0x08,0x00,0xF8,0x00,0x08,0xF8,0x00,
    0x03,0x3C,0x07,0x00,0x07,0x3C,0x03,0x00},// W 55
    {0x08,0x18,0x68,0x80,0x80,0x68,0x18,0x08,
    0x20,0x30,0x2C,0x03,0x03,0x2C,0x30,0x20},// X 56
    {0x08,0x38,0xC8,0x00,0xC8,0x38,0x08,0x00,
    0x00,0x00,0x20,0x3F,0x20,0x00,0x00,0x00},// Y 57
    {0x10,0x08,0x08,0x08,0xC8,0x38,0x08,0x00,
    0x20,0x38,0x26,0x21,0x20,0x20,0x18,0x00},// Z 58
    {0x00,0x00,0x00,0xFE,0x02,0x02,0x02,0x00,
    0x00,0x00,0x00,0x7F,0x40,0x40,0x40,0x00},// [ 59
    {0x00,0x0C,0x30,0xC0,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x01,0x06,0x38,0xC0,0x00},// \ 60
    {0x00,0x02,0x02,0x02,0xFE,0x00,0x00,0x00,
    0x00,0x40,0x40,0x40,0x7F,0x00,0x00,0x00},// ] 61
    {0x00,0x20,0x10,0x08,0x04,0x08,0x10,0x20,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},// ^ 62
    {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80},// _ 63
    {0x00,0x02,0x04,0x08,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00},// ` 64
    {0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,
    0x00,0x19,0x24,0x22,0x22,0x22,0x3F,0x20},// a 65
    {0x08,0xF8,0x00,0x80,0x80,0x00,0x00,0x00,
    0x00,0x3F,0x11,0x20,0x20,0x11,0x0E,0x00},// b 66
    {0x00,0x00,0x00,0x80,0x80,0x80,0x00,0x00,
    0x00,0x0E,0x11,0x20,0x20,0x20,0x11,0x00},// c 67
    {0x00,0x00,0x00,0x80,0x80,0x88,0xF8,0x00,
    0x00,0x0E,0x11,0x20,0x20,0x10,0x3F,0x20},// d 68
    {0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,
    0x00,0x1F,0x22,0x22,0x22,0x22,0x13,0x00},// e 69
    {0x00,0x80,0x80,0xF0,0x88,0x88,0x88,0x18,
    0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00},// f 70
    {0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,
    0x00,0x6B,0x94,0x94,0x94,0x93,0x60,0x00},// g 71
    {0x08,0xF8,0x00,0x80,0x80,0x80,0x00,0x00,
    0x20,0x3F,0x21,0x00,0x00,0x20,0x3F,0x20},// h 72
    {0x00,0x80,0x98,0x98,0x00,0x00,0x00,0x00,
    0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00},// i 73
    {0x00,0x00,0x00,0x80,0x98,0x98,0x00,0x00,
    0x00,0xC0,0x80,0x80,0x80,0x7F,0x00,0x00},// j 74
    {0x08,0xF8,0x00,0x00,0x80,0x80,0x80,0x00,
    0x20,0x3F,0x24,0x02,0x2D,0x30,0x20,0x00},// k 75
    {0x00,0x08,0x08,0xF8,0x00,0x00,0x00,0x00,
    0x00,0x20,0x20,0x3F,0x20,0x20,0x00,0x00},// l 76
    {0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x00,
    0x20,0x3F,0x20,0x00,0x3F,0x20,0x00,0x3F},// m 77
    {0x00,0x80,0x80,0x00,0x80,0x80,0x00,0x00,
    0x00,0x20,0x3F,0x21,0x00,0x20,0x3F,0x20},// n 78
    {0x00,0x00,0x80,0x80,0x80,0x80,0x00,0x00,
    0x00,0x1F,0x20,0x20,0x20,0x20,0x1F,0x00},// o 79
    {0x80,0x80,0x00,0x80,0x80,0x00,0x00,0x00,
    0x80,0xFF,0xA1,0x20,0x20,0x11,0x0E,0x00},// p 80
    {0x00,0x00,0x00,0x80,0x80,0x80,0x80,0x00,
    0x00,0x0E,0x11,0x20,0x20,0xA0,0xFF,0x80},// q 81
    {0x80,0x80,0x80,0x00,0x80,0x80,0x80,0x00,
    0x20,0x20,0x3F,0x21,0x20,0x00,0x01,0x00},// r 82
    {0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,
    0x00,0x33,0x24,0x24,0x24,0x24,0x19,0x00},// s 83
    {0x00,0x80,0x80,0xE0,0x80,0x80,0x00,0x00,
    0x00,0x00,0x00,0x1F,0x20,0x20,0x00,0x00},// t 84
    {0x80,0x80,0x00,0x00,0x00,0x80,0x80,0x00,
    0x00,0x1F,0x20,0x20,0x20,0x10,0x3F,0x20},// u 85
    {0x80,0x80,0x80,0x00,0x00,0x80,0x80,0x80,
    0x00,0x01,0x0E,0x30,0x08,0x06,0x01,0x00},// v 86
    {0x80,0x80,0x00,0x80,0x00,0x80,0x80,0x80,
    0x0F,0x30,0x0C,0x03,0x0C,0x30,0x0F,0x00},// w 87
    {0x00,0x80,0x80,0x00,0x80,0x80,0x80,0x00,
    0x00,0x20,0x31,0x2E,0x0E,0x31,0x20,0x00},// x 88
    {0x80,0x80,0x80,0x00,0x00,0x80,0x80,0x80,
    0x80,0x81,0x8E,0x70,0x18,0x06,0x01,0x00},// y 89
    {0x00,0x80,0x80,0x80,0x80,0x80,0x80,0x00,
    0x00,0x21,0x30,0x2C,0x22,0x21,0x30,0x00},// z 90
    {0x00,0x00,0x00,0x00,0x80,0x7C,0x02,0x02,
    0x00,0x00,0x00,0x00,0x00,0x3F,0x40,0x40},// { 91
    {0x00,0x00,0x00,0x00,0xFF,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0xFF,0x00,0x00,0x00},// | 92
    {0x00,0x02,0x02,0x7C,0x80,0x00,0x00,0x00,
    0x00,0x40,0x40,0x3F,0x00,0x00,0x00,0x00},// } 93
    {0x00,0x80,0x40,0x40,0x80,0x00,0x00,0x80,
    0x00,0x00,0x00,0x00,0x00,0x01,0x01,0x00},// ~ 94
};
#endif
```

# 从0开始使用面对对象C语言搭建一个基于OLED的图形显示框架（动态菜单组件实现）

​终于，我们来到了这个令人激动的部分了，现在，我们终于把所有的基础工作做好了，就差我们的动态组件了。

## 面对对象C的程序设计（范例）

​我想，你可能使用过C++这门语言，他派生于C，但是最终的惯用编程范式又远远不同于C。尽管如此，C仍然可以按照一个相对变扭的方式完成面对对象的程序设计。这是因为在C语言本质上是过程化语言，没有直接的类和对象概念，因**此面向对象设计需要通过结构体、函数指针等手段模拟实现。**

​面对对象，首先讲究的就是把所有的目标看成对象。举个例子，现在我们来看看动态多级菜单这个东西，按照面对对象的设计思路。我们说面对对象它通过抽象和封装将数据与功能结合，形成具有特定属性和行为的对象。

```c
typedef struct {
    int x;
    int y;
    void (*move)(struct Point*, int, int);
} Point;

void movePoint(Point* p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}

int main() {
    Point p = {0, 0, movePoint};
    p.move(&p, 5, 3);
    return 0;
}
```

​这个就是一个将点看作对象的例子。

​我们设计对象的时候，**要思考对象能干什么，进一步的，才需要知道他需要有什么。**这种方式可以辅助一个习惯于面对过程的朋友设计一个对象。

## 面对对象C的程序设计（应用）

​我们现在把上面谈到的用一下。

-   他能显示多级的文字菜单
-   他能将目前选中的文本区域进行反色
-   他能再切换选中文本的时候演示一个阻塞的动画（提示，笔者的框架没有做异步，这需要牵扯到中断，笔者不打算现在做）
-   如果一个子项存在子菜单，他能显示出来这个子菜单，然后还能返回去（怎么样触发进入和返回不是我们关心的，**他能！**）
-   他可以显示和隐藏我们的icon，为此，我们还需要注册接口。

​为了做到上面的事情，我们要想他要拥有什么。

-   一个简略的文本编辑器，他能展示文字，我们菜单的文本绘制基本上依赖于这个文本编辑器
-   一个负责动画演示的结构体（对象），他能完成我们对"他能再切换选中文本的时候演示一个阻塞的动画"这个任务
-   一个菜单子项结构体数组，他维护了当前这个菜单子项的文本显示，是否有子菜单，甚至，还需要有callback行为的结构体数组（这个是额外任务，笔者没有做callback）

```c
typedef void* CCgraphicWidgetBase;

/* update requist functions */
typedef void(*Update)(CCgraphicWidgetBase);
typedef void(*Hide)(CCgraphicWidgetBase);
typedef void(*Show)(CCgraphicWidgetBase);

typedef struct{
    Update      update;
    Hide        hide;
    Show        show;
}CCGraphicWidgetCommonOperation;

typedef struct
{
    CCGraphicWidgetCommonOperation  common;
    void (*switchToIndex)(CCGraphic_Menu*, uint8_t index);
    void (*enabled_showAnimations)(CCGraphic_Menu*, uint8_t enabled);
    void (*setIcon)(CCGraphic_Menu*, CCGraphic_Image* image, uint8_t size);
    void (*showIcon)(CCGraphic_Menu*);
    void (*hideIcon)(CCGraphic_Menu*);
    CCGraphic_Menu* (*enterSub)(CCGraphic_Menu*);
    CCGraphic_Menu* (*backParent)(CCGraphic_Menu*);
}CCGraphic_MenuOperations;

typedef struct __CCGraphic_Menu{
    // 菜单项数组
    CCGraphic_MenuItem*         menuItemArrays;
    // 菜单项数组个数
    uint8_t                     menuArraySize;
    
    // 内部主控件
    CCGraphicTextEdit*          internelTextEdit;
    // 动画负责的结构体
    CCGraphic_MenuAnimations*   animation_holder;
    // 操作
    CCGraphic_MenuOperations    operations;
    // 当前维护的其他信息
    uint8_t                     current_offset;
    uint8_t                     enabled_animations;
    CCGraphic_Image*            icons_sources;
    uint8_t                     icon_size;
    uint8_t                     icon_state;
}CCGraphic_Menu;
```

> 任务：你可以改进这个抽象！你可以看到零碎一地的变量成员不太美观！

## 进一步谈论我上面给出的代码------继承

​让我们进一步讨论更多的概念，上面的代码出现了一个很有意思的片段

```text
typedef void* CCgraphicWidgetBase;

/* update requist functions */
typedef void(*Update)(CCgraphicWidgetBase);
typedef void(*Hide)(CCgraphicWidgetBase);
typedef void(*Show)(CCgraphicWidgetBase);

typedef struct{
    Update      update;
    Hide        hide;
    Show        show;
}CCGraphicWidgetCommonOperation;

typedef struct
{
    CCGraphicWidgetCommonOperation  common;
    void (*switchToIndex)(CCGraphic_Menu*, uint8_t index);
    void (*enabled_showAnimations)(CCGraphic_Menu*, uint8_t enabled);
    void (*setIcon)(CCGraphic_Menu*, CCGraphic_Image* image, uint8_t size);
    void (*showIcon)(CCGraphic_Menu*);
    void (*hideIcon)(CCGraphic_Menu*);
    CCGraphic_Menu* (*enterSub)(CCGraphic_Menu*);
    CCGraphic_Menu* (*backParent)(CCGraphic_Menu*);
}CCGraphic_MenuOperations;
```

​仔细研究一下，你会发现，我们似乎复用了一个结构体：CCGraphicWidgetCommonOperation，也就是组件Widget的通用操作。为了理解这个特征，我们先不着急，实现一个完全面对对象的，一个简单的文本编辑器

### 实现一个面对对象的文本编辑器

```c
#ifndef CCGraphic_TextEdit_H
#define CCGraphic_TextEdit_H
#include "Graphic/widgets/common/CCGraphic_WidgetBase.h"
#include "Graphic/base/CCGraphic_Point/CCGraphic_Point.h"
#include "Graphic/widgets/common/CCGraphic_Size/CCGraphic_Size.h"
#include "Graphic/widgets/common/CCGraphic_WidgetBase.h"
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextItem.h"
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextConfig.h"
typedef struct __CCGraphicTextEdit CCGraphicTextEdit;  
// 前向声明：定义一个名为 `CCGraphicTextEdit` 的结构体类型。  

typedef struct {  
    CCGraphicWidgetCommonOperation operation;  
    // 控件通用操作，提供基本控件功能。  

    void (*appendText)(CCGraphicTextEdit*, char* appendee);  
    // 函数指针：向文本控件追加文本。  

    void (*setText)(CCGraphicTextEdit*, char* text);  
    // 函数指针：设置控件内的完整文本内容。  

    void (*newLineText)(CCGraphicTextEdit*, char* text);  
    // 函数指针：在控件中新起一行并写入文本。  

    void (*clear)(CCGraphicTextEdit*);  
    // 函数指针：清空控件中的文本。  

    void (*relocate)(CCGraphicTextEdit*, CCGraphic_Point p, CCGraphic_Size size);  
    // 函数指针：重新定位控件位置并调整控件尺寸。  

} CCGraphicTextEdit_SupportiveOperations;  
// 结构体 `CCGraphicTextEdit_SupportiveOperations`：定义文本控件支持的操作集合。  

typedef struct __CCGraphicTextEdit {  
    uint8_t acquired_stepped_update;  
    // 标记是否启用分步更新机制的标志变量。  

    CCDeviceHandler* borrowed_device;  
    // 设备处理器指针，用于管理外部设备资源。  

    CCGraphicTextEdit_SupportiveOperations operations;  
    // 文本控件支持操作的集合。  

    CCGraphic_AsciiTextItem* handle;  
    // 控件中的具体文本项句柄，用于操作字符显示内容。  

} CCGraphicTextEdit;  
// 结构体 `CCGraphicTextEdit`：定义文本控件的属性与操作。  

void CCGraphic_init_CCGraphicTextEdit(  
    CCGraphicTextEdit* text_self,  
    CCDeviceHandler* handler,  
    CCGraphic_AsciiTextItem* inited  
);  
// 函数声明：初始化 `CCGraphicTextEdit` 控件，传入控件对象、设备处理器和已初始化的文本项。  
#endif
```

​你可能会问，怎么看起来这么奇怪，我们应该如何调用功能呢？你看，这就是思维没有转变过来，笔者想要说的是，现在功能被集成进入了结构体，意味着，我们想要调用的不叫函数了，是一个结构体的方法。

```text
static void __helper_on_set_text(CCGraphicTextEdit* edit, char* sources, uint32_t shown_time)
{
    edit->operations.setText(edit, sources);
    HAL_Delay(shown_time * 1000);
    edit->operations.clear(edit);
}
```

​看到了吗？当我们想要设置文本的时候，不是

```text
CCGraphicTextEdit_setText(edit, sources);
```

​而是

```text
edit->operations.setText(edit, sources);
```

​看起来好像没什么区别，我想说的是，你现在不知道，**也没法去引用一个函数，叫"给一个是CCGraphicTextEdit的结构体设置文本"的函数，你找不到**，我藏起来了（笑），而是，**一个属于CCGraphicTextEdit这个类的对象可以被设置文本，文本是sources**，这就是面对对象的设计思考范式。换而言之，**一个CCGraphicTextEdit的对象可以设置文本，他能设置文本而且优先的投射到绘图设备上，而你完全不知道底下发生了什么，只知道这样做一定没有问题！**

​在源文件中，我们才将如何实现暴露出来

```text
#include "Graphic/widgets/components/CCGraphic_TextEdit/CCGraphic_TextEdit.h"
#include "Graphic/widgets/base/CCGraphic_TextItem/CCGraphic_TextItem.h"
#include "Graphic/CCGraphic_device_adapter.h"

static void __pvt_update_text(CCGraphicTextEdit* text_self)  
// 静态函数：更新控件所依赖的设备内容。  
{
    text_self->borrowed_device->operations.update_device_function(
        text_self->borrowed_device  
        // 调用设备的更新函数，使文本控件的内容刷新显示。  
    );
}

static void __pvt_show(CCGraphicTextEdit* text_self)  
// 静态函数：绘制并显示文本控件内容。  
{
    CCGraphicWidget_drawAsciiTextItem(
        text_self->borrowed_device, text_self->handle  
        // 绘制文本控件的内容。  
    );
    if(text_self->acquired_stepped_update)  
        // 如果启用了分步更新，则执行设备更新。  
        __pvt_update_text(text_self);
}

static void __pvt_hide(CCGraphicTextEdit* text_self)  
// 静态函数：隐藏控件，即清除其显示区域。  
{
    text_self->borrowed_device->operations.clearArea_function(
        text_self->borrowed_device, 
        text_self->handle->tl_point.x,  
        text_self->handle->tl_point.y,  
        text_self->handle->TexthandleSize.width,  
        text_self->handle->TexthandleSize.height  
        // 清除控件所在区域的内容。  
    );
    __pvt_update_text(text_self);
}

static void __pvt_clear_text(CCGraphicTextEdit* text_self)  
// 静态函数：清除控件中的文本内容。  
{
    CCGraphic_Point tl = text_self->handle->tl_point;  
    CCGraphic_Size size = text_self->handle->TexthandleSize;  
    // 获取控件左上角坐标和尺寸，用于清除操作。  

    text_self->borrowed_device->operations.clearArea_function(
        text_self->borrowed_device, tl.x, tl.y, size.width, size.height  
        // 执行清除操作。  
    );
    __pvt_update_text(text_self);
}

static void __pvt_append_text(CCGraphicTextEdit* text_self, char* text)  
// 静态函数：向控件追加文本。  
{
    CCGraphicWidget_AsciiTextItem_setAsciiText(text_self->handle, text);  
    // 设置追加的文本内容。  
    __pvt_show(text_self);  
    // 显示控件内容。  
}

static void __pvt_newLine_text(CCGraphicTextEdit* text_self, char* text)  
// 静态函数：在控件中新建一行并写入文本。  
{
    CCGraphic_Point new_begin =  
        CCGraphicWidget_AsciiTextItem_on_newLine_point(text_self->handle);  
    // 获取新行起始点坐标。  

    CCGraphicWidget_AsciiTextItem_setAsciiText(text_self->handle, text);  
    // 设置文本内容。  

    CCGraphicWidget_AsciiTextItem_setIndexedPoint(text_self->handle, &new_begin);  
    // 更新文本项的绘制位置。  

    __pvt_show(text_self);  
    // 显示控件内容。  
}

static void __pvt_setText(CCGraphicTextEdit* text_self, char* text)  
// 静态函数：设置控件的完整文本内容。  
{
    __pvt_clear_text(text_self);  
    // 清除原有内容。  

    CCGraphicWidget_AsciiTextItem_setIndexedPoint(
        text_self->handle, 
        &(text_self->handle->tl_point)  
        // 重置文本绘制位置为控件起点。  
    );

    CCGraphicWidget_AsciiTextItem_setAsciiText(text_self->handle, text);  
    // 设置新的文本内容。  

    __pvt_show(text_self);  
    // 显示控件内容。  
}

static void __pvt_relocate(CCGraphicTextEdit* edit, CCGraphic_Point p, CCGraphic_Size size)  
// 静态函数：重新定位控件位置并调整尺寸。  
{
    __pvt_hide(edit);  
    // 隐藏控件内容。  

    CCGraphicWidget_AsciiTextItem_relocate(edit->handle, p, size);  
    // 重新设置控件位置和尺寸。  
}

void CCGraphic_init_CCGraphicTextEdit(  
    CCGraphicTextEdit* text_self,  
    CCDeviceHandler* handler,  
    CCGraphic_AsciiTextItem* inited  
)  
// 初始化函数：设置文本编辑控件的初始状态。  
{
    text_self->acquired_stepped_update = 0;  
    // 初始化为未启用分步更新。  

    text_self->borrowed_device = handler;  
    // 绑定设备处理器。  

    text_self->handle = inited;  
    // 设置文本项句柄。  

    text_self->operations.appendText = __pvt_append_text;  
    text_self->operations.clear = __pvt_clear_text;  
    text_self->operations.newLineText = __pvt_newLine_text;  
    text_self->operations.setText = __pvt_setText;  
    text_self->operations.relocate = __pvt_relocate;  
    // 绑定控件的各类操作函数。  

    text_self->operations.operation.hide = (Hide)__pvt_hide;  
    text_self->operations.operation.show = (Show)__pvt_show;  
    text_self->operations.operation.update = (Update)__pvt_update_text;  
    // 绑定通用控件操作。  
}
```

​可以看到，代码被分成了一层一层的，关心哪一个方法，只需要进入对应的方法查看即可。

### 所以，什么是继承

​**继承**允许一个类从另一个类中获取属性和方法，从而实现代码复用和逻辑扩展。也就是说，我们认为继承表达了"一个对象是另一个对象"的陈述。比如说。

```text
typedef struct {  
    CCGraphicWidgetCommonOperation operation;  
    // 控件通用操作，提供基本控件功能。  

    void (*appendText)(CCGraphicTextEdit*, char* appendee);  
    // 函数指针：向文本控件追加文本。  

    void (*setText)(CCGraphicTextEdit*, char* text);  
    // 函数指针：设置控件内的完整文本内容。  

    void (*newLineText)(CCGraphicTextEdit*, char* text);  
    // 函数指针：在控件中新起一行并写入文本。  

    void (*clear)(CCGraphicTextEdit*);  
    // 函数指针：清空控件中的文本。  

    void (*relocate)(CCGraphicTextEdit*, CCGraphic_Point p, CCGraphic_Size size);  
    // 函数指针：重新定位控件位置并调整控件尺寸。  

} CCGraphicTextEdit_SupportiveOperations;  
```

​表达了CCGraphicTextEdit的功能集合是CCGraphicWidget的一个超集，他不光拥有一个Widget该有的操作，而且，还有自己跟Widget独有的操作，这就是继承的力量------复用接口，甚至可以是实现！

## 重申我们对菜单的抽象

​根据最之前的描述，菜单本身应该是一个树状的结构，你可以看到：

### 抽象菜单项目

```c
#ifndef CCGraphic_MenuItem_H
#define CCGraphic_MenuItem_H
#include "Graphic/CCGraphic_common.h"
/* This version we use simple menu Item */

/* announced the menu type for the further usage */  
// 预声明 `CCGraphic_Menu` 类型，用于菜单关联。  

typedef struct __CCGraphic_Menu CCGraphic_Menu;  
// 结构体 `CCGraphic_Menu` 的前向声明，以便在结构中使用指针引用该类型。  

#define NO_SUB_MENU (NULL)  
// 定义宏 `NO_SUB_MENU` 表示没有子菜单，为空指针。  

typedef struct __CCGraphic_MenuItem {  
    char* text;  
    // 菜单项显示的文本内容。  

    CCGraphic_Menu* subMenu;  
    // 指向子菜单的指针，若无子菜单则为 `NO_SUB_MENU`。  

    CCGraphic_Menu* parentMenu;  
    // 指向父菜单的指针，用于返回或层级控制。  
} CCGraphic_MenuItem;  
// 定义菜单项结构体 `CCGraphic_MenuItem`，包含菜单文字、子菜单及父菜单指针。  

void CCGraphic_MenuItem_register_menuItem(  
    CCGraphic_MenuItem* item,  
    // 菜单项指针，用于注册菜单项。  

    CCGraphic_Menu* parentMenu,  
    // 父菜单指针，将菜单项附加到此菜单下。  

    char* text,  
    // 菜单项文本内容。  

    CCGraphic_Menu* subMenu  
    // 子菜单指针，可为 `NO_SUB_MENU`。  
);  
// 函数声明：将菜单项注册到指定父菜单下，同时设置菜单项文本和子菜单。  
#endif
```

> 提示：需要做callback?（用户明确选择了这个菜单项目）试一下在CCGraphic_MenuItem中添加抽象！完成你的代码！

### 抽象菜单动画

```c
typedef struct __CCGraphic_MenuAnimations CCGraphic_MenuAnimations;  
// 前向声明 `CCGraphic_MenuAnimations` 结构体，表示菜单动画的管理结构。  

typedef void (*DoByStep)(CCGraphic_MenuAnimations*);  
// 定义一个函数指针类型 `DoByStep`，指向以 `CCGraphic_MenuAnimations*` 为参数的函数，
// 该函数用于执行逐步动画操作。  

typedef struct {  
    DoByStep doByStep;  
    // 操作结构体，包含逐步执行动画的函数指针。  
} CCGraphic_MenuAnimationsOperations;  
// 定义 `CCGraphic_MenuAnimationsOperations` 结构体，封装了逐步动画执行的操作。  

/*
    this struct shouldn't be registered by programmers
    it shoule be registered by program, so no interface is
    publiced!
*/  
// 该结构体不应由程序员手动注册，而是由程序自动注册，因此没有提供公开接口。  

typedef struct __CCGraphic_MenuAnimations {  
    /* animating rectangle */  
    // 定义菜单动画的结构体。  

    CCDeviceHandler* handler;  
    // 设备处理器，用于控制设备的操作。  

    CCGraphic_Point tl_point;  
    // 动画的起始点（左上角坐标）。  

    CCGraphic_Size animationOffsetSize;  
    // 动画的偏移尺寸，用于表示动画区域的大小。  

    int16_t x_step;  
    // x轴每步移动的像素值，用于控制动画的水平位移。  

    int16_t y_step;  
    // y轴每步移动的像素值，用于控制动画的垂直位移。  

    CCGraphic_MenuAnimationsOperations op;  
    // 操作对象，包含执行逐步动画的函数指针。  

    uint8_t is_doing;  
    // 标志位，表示动画是否正在进行中。  
} CCGraphic_MenuAnimations;  
// 定义菜单动画结构体，封装了动画的状态、操作及设备控制。  
```

​初始化一个动画的办法是：

```text
static void __pvt_init_animations(  
    CCGraphic_Menu*             menu,  
    CCGraphic_MenuAnimations*   animations  
) {  
    /* no animations are registered */  
    // 如果没有提供动画对象，直接返回。  
    if (animations == NULL) {  
        return;  
    }

    // 获取菜单中的文本编辑项句柄，进行后续动画初始化。  
    CCGraphic_AsciiTextItem* internelTextEdit = menu->internelTextEdit->handle;  

    /* calculate the animations holding size */  
    // 计算动画的大小，首先设置动画起始点为文本编辑项的起始点。  
    animations->tl_point = internelTextEdit->tl_point;  

    // 设置动画的高度为字体的大小（通过 `__fetch_font_size` 获取字体的高度）。  
    animations->animationOffsetSize.height = __fetch_font_size(internelTextEdit->font_size).height;  

    // 设置动画的宽度为文本处理器的宽度。  
    animations->animationOffsetSize.width = internelTextEdit->TexthandleSize.width;  

    // 设置设备处理器，使用菜单中的文本编辑项借用的设备。  
    animations->handler = menu->internelTextEdit->borrowed_device;  

    // 设置每步的水平和垂直步长（默认值）。  
    animations->x_step = _DEFAULT_X_STEP;  
    animations->y_step = _DEFAULT_Y_STEP;  

    // 设置执行逐步动画操作的函数指针，指向 `__pvt_doByStep` 函数。  
    animations->op.doByStep = __pvt_doByStep;  

    /* set state */  
    // 设置动画状态为未开始。  
    animations->is_doing = 0;  
}  
```

​对于逐步开始动画的办法是

```text
/* do by steps */
static void __pvt_doByStep(CCGraphic_MenuAnimations* animations)  
{  
    // 如果动画尚未开始（is_doing 为 0），则直接返回，避免不必要的操作。  
    if (!animations->is_doing) return;  

    // 使用设备的操作对象反转（擦除）动画区域，传入当前动画的起始位置（tl_point）和尺寸。  
    animations->handler->operations.reverseArea_function(  
        animations->handler,  
        animations->tl_point.x, animations->tl_point.y,  
        animations->animationOffsetSize.width,  
        animations->animationOffsetSize.height  
    );  

    // 更新动画的起始点（左上角坐标），按水平步长（x_step）和垂直步长（y_step）更新。  
    animations->tl_point.x += animations->x_step;  
    animations->tl_point.y += animations->y_step;  

    // 再次调用反转（擦除）区域，传入更新后的动画位置和尺寸。  
    animations->handler->operations.reverseArea_function(  
        animations->handler,  
        animations->tl_point.x, animations->tl_point.y,  
        animations->animationOffsetSize.width,  
        animations->animationOffsetSize.height  
    );  

    // 调用更新设备函数，刷新屏幕以显示动画效果。  
    animations->handler->operations.update_device_function(  
        animations->handler  
    );  
}  
```

​看到了吗，非必要不调用刷新设备的操作就在这里体现了。当然，当我们配置不需要动画的时候

```text
static void __pvt_do_as_immediate(
    CCGraphic_MenuAnimations* animations, 
    CCGraphic_Point*        end_tpl)
{
    if(!animations->is_doing) return;
    animations->handler->operations.reverseArea_function(
        animations->handler, 
        animations->tl_point.x, animations->tl_point.y,
        animations->animationOffsetSize.width, 
        animations->animationOffsetSize.height
    );
    animations->tl_point = *end_tpl;
    animations->handler->operations.reverseArea_function(
        animations->handler, 
        animations->tl_point.x, animations->tl_point.y,
        animations->animationOffsetSize.width, 
        animations->animationOffsetSize.height
    );
    animations->handler->operations.update_device_function(
        animations->handler);
}
```

​直接拉到最后就好了。

### 实现菜单功能

​到了真正实现的时候，一切反而水到渠成。

#### 初始化我们的菜单

```text
void CCGraphic_init_Menu(
    CCGraphic_Menu*             blank_menu,
    CCGraphic_MenuItem*         menuItemArrays,
    uint8_t                     menuArraySize,
    CCGraphicTextEdit*          configured_menu,
    CCGraphic_MenuAnimations*   blank_animations,
    uint8_t                     enabled_animations 
)
{
    blank_menu->internelTextEdit    = configured_menu;
    blank_menu->menuItemArrays      = menuItemArrays;
    blank_menu->menuArraySize       = menuArraySize;
    blank_menu->animation_holder    = blank_animations;
    blank_menu->current_offset      = 0;
    blank_menu->icon_state          = 0;
    blank_menu->enabled_animations = enabled_animations;

    // map the functions
    blank_menu->operations.common.hide      = (Hide)__pvt_hide_CCGraphic_Menu;
    blank_menu->operations.common.show      = (Show)__pvt_show_CCGraphic_Menu;
    blank_menu->operations.common.update    = (Update)__pvt_update;
    blank_menu->operations.switchToIndex    = __pvt_switchIndex;
    blank_menu->operations.enabled_showAnimations = 
        __pvt_setAnimationShowState_wrapper;
    
    // icons
    blank_menu->operations.setIcon = __pvt_setIcon;
    blank_menu->operations.hideIcon = __pvt_hideIcon;
    blank_menu->operations.showIcon = __pvt_showIcon;
    blank_menu->operations.enterSub = __pvt_enterSub;
    blank_menu->operations.backParent = __pvt_backParent;
    __pvt_init_animations(blank_menu, blank_animations);
}
```

#### 关于我们的图标设置，显示和隐藏

```text
static void __pvt_setIcon(CCGraphic_Menu* menu, CCGraphic_Image* sources, uint8_t size)  
{  
    // 设置菜单的图标源和图标数量  
    menu->icons_sources = sources;  
    menu->icon_size = size;  

    // 初始化每个图标的尺寸和位置  
    for (uint8_t i = 0; i < menu->icon_size; i++) {  
        // 设置图标的高度和宽度  
        sources[i].image_size.height = ICON_HEIGHT;  
        sources[i].image_size.width = ICON_WIDTH;  

        // 设置每个图标的位置，`y` 方向依次排列  
        sources[i].point.x = 0;  
        sources[i].point.y = i * ICON_HEIGHT;  
    }  

    // 显示图标  
    __pvt_showIcon(menu);  
}  

static void __pvt_showIcon(CCGraphic_Menu* menu)  
{  
    // 如果没有图标源，则不执行任何操作  
    if (!menu->icons_sources) return;  
    
    // 设置图标的状态为显示（1）  
    menu->icon_state = 1;  
    
    CCGraphic_Point tlp;  
    CCGraphic_Size _size;  
    
    // 获取显示图标的位置和大小  
    __pvt_providePoint(menu, &tlp, 1);  
    __pvt_provideSize(menu, &_size, 1);  
    
    // 设置动画的显示状态为 0（关闭动画）  
    __pvt_setAnimationShowState(menu->animation_holder, 0);  
    
    // 将菜单项的文本编辑区域重新定位到指定的位置和大小  
    menu->internelTextEdit->operations.relocate(menu->internelTextEdit, tlp, _size);  
    
    // 遍历图标源，逐一绘制每个图标  
    for (uint8_t i = 0; i < menu->icon_size; i++) {  
        CCGraphicWidget_draw_image(  
            menu->internelTextEdit->borrowed_device,  
            &menu->icons_sources[i]  
        );  
    }  
    
    // 设置动画的显示状态为 1（启用动画）  
    __pvt_setAnimationShowState(menu->animation_holder, 1);  
    
    // 仅显示文本编辑器  
    __pvt_show_textEditOnly(menu);  
}  

static void __pvt_hideIcon(CCGraphic_Menu* menu)  
{  
    // 如果没有图标源，则不执行任何操作  
    if (!menu->icons_sources) return;  
    
    CCGraphic_Point tlp;  
    CCGraphic_Size _size;  
    
    // 设置图标的状态为隐藏（0）  
    menu->icon_state = 0;  
    
    // 获取隐藏图标的位置和大小  
    __pvt_providePoint(menu, &tlp, 0);  
    __pvt_provideSize(menu, &_size, 0);  
    
    // 设置动画的显示状态为 0（关闭动画）  
    __pvt_setAnimationShowState(menu->animation_holder, 0);  
    
    // 将菜单项的文本编辑区域重新定位到指定的位置和大小  
    menu->internelTextEdit->operations.relocate(menu->internelTextEdit, tlp, _size);  
    
    // 清除图标区域  
    menu->internelTextEdit->borrowed_device->operations.clearArea_function(  
        menu->internelTextEdit->borrowed_device,  
        0, 0, ICON_WIDTH, ICON_HEIGHT * menu->icon_size  
    );  
    
    // 仅显示文本编辑器  
    __pvt_show_textEditOnly(menu);  
}  
```

​图标的绘制就是让位子绘制，清除掉重新绘制这个思路。

#### 菜单本体功能

```text
static void __pvt_update(CCGraphic_Menu* menu)
{
    // 调用文本编辑器的更新操作，刷新菜单显示
    menu->internelTextEdit->operations.operation.update(
        menu->internelTextEdit
    );
}

// 更新动画状态
static void __pvt_setAnimationShowState(
    CCGraphic_MenuAnimations* animations, uint8_t is_doing)
{
    // 如果动画状态没有变化，直接返回
    if(is_doing == animations->is_doing){
        return;
    }
    // 如果动画正在进行，先逆向绘制区域，清除之前的显示
    animations->handler->operations.reverseArea_function(
        animations->handler, 
        animations->tl_point.x, animations->tl_point.y,
        animations->animationOffsetSize.width, 
        animations->animationOffsetSize.height
    );
    // 更新动画状态
    animations->is_doing = is_doing;
    // 更新设备，刷新显示
    animations->handler->operations.update_device_function(
        animations->handler);
}

/*
    以下是显示/隐藏图标时，提供布局计算的函数
*/
static void __pvt_providePoint(
    CCGraphic_Menu* menu, 
    CCGraphic_Point* p, 
    uint8_t icons_enabled)
{
    // 根据是否启用图标，设置图标显示的起始位置
    p->x = icons_enabled ? ICON_WIDTH : 0;
    p->y = 0;
}

static void __pvt_provideSize(
    CCGraphic_Menu* menu, 
    CCGraphic_Size* size, 
    uint8_t icons_enabled
){
    // 根据是否启用图标，调整文本区域的宽度和高度
    size->width = menu->internelTextEdit->handle->TexthandleSize.width - 
        (icons_enabled ? ICON_HEIGHT : 0);
    size->height = menu->internelTextEdit->handle->TexthandleSize.height;
}

// 获取当前菜单项是否有子菜单
static inline CCGraphic_Menu* __pvt_current_owns_subMenu(CCGraphic_Menu* menu)
{
    return  menu->menuItemArrays[
            menu->current_offset].subMenu;
}

// 获取当前菜单项的父菜单
static inline CCGraphic_Menu* __pvt_owns_parent_current(CCGraphic_Menu* menu)
{
    return  menu->menuItemArrays[
            menu->current_offset].parentMenu;
}

// 仅显示文本编辑器的内容，更新菜单显示
void __pvt_show_textEditOnly(CCGraphic_Menu* menu)
{
    // 如果菜单没有项，则直接返回
    if(menu->menuArraySize == 0){
        return;
    }
    // 设置动画状态为不显示
    __pvt_setAnimationShowState(menu->animation_holder, 0);
    // 设置文本编辑器的内容，显示第一项菜单
    CCGraphicTextEdit* edit = menu->internelTextEdit;
    edit->operations.setText(edit, menu->menuItemArrays[0].text);
    // 显示后续菜单项
    for(uint8_t i = 1; i < menu->menuArraySize; i++)
    {
        edit->operations.newLineText(edit, menu->menuItemArrays[i].text);
    }
    // 设置动画状态为显示
    __pvt_setAnimationShowState(menu->animation_holder, 1);    
}

// 隐藏菜单和图标
void __pvt_hide_CCGraphic_Menu(CCGraphic_Menu* menu)
{
    // 隐藏图标
    __pvt_hideIcon(menu);
    // 隐藏文本编辑器
    menu->internelTextEdit->operations.operation.hide(menu->internelTextEdit);
    // 获取动画控制器
    CCGraphic_MenuAnimations* animation = menu->animation_holder;
    // 如果没有动画控制器，则返回
    if(!animation) return;
    // 如果动画正在进行，则停止动画
    if(animation->is_doing){
        __pvt_setAnimationShowState(animation, 0);
    }
}

/* 绘制菜单显示 */
void __pvt_show_CCGraphic_Menu(CCGraphic_Menu* menu)
{
    // 仅显示文本编辑器内容
    __pvt_show_textEditOnly(menu);   
}

// 执行动画，逐步更新菜单位置直到目标位置
void __pvt_do_stepped_animate(
    CCGraphic_MenuAnimations* animations, 
    CCGraphic_Point* end_tl_p 
)
{
    // 如果动画步长为负，表示需要向下移动
    if(animations->y_step < 0){
        // 逐步向下执行动画，直到达到目标位置
        while(animations->tl_point.y > end_tl_p->y){
            __pvt_doByStep(animations);  // 执行单步动画
#ifdef REQ_ANIMATION_DELAY
            // 延时，模拟动画效果
            __device_delay(ANIMATION_DELAY_MS);
#endif
        }
    }
    // 如果动画步长为正，表示需要向上移动
    else
    {
        // 逐步向上执行动画，直到达到目标位置
        while(animations->tl_point.y < end_tl_p->y){
            __pvt_doByStep(animations);  // 执行单步动画
#ifdef REQ_ANIMATION_DELAY
            // 延时，模拟动画效果
            __device_delay(ANIMATION_DELAY_MS);
#endif
        }        
    }
    
}
```

#### 关于切换focus的菜单和进入父子菜单的函数

```text
// 切换菜单项索引并执行动画
static void __pvt_switchIndex(
    CCGraphic_Menu* menu, uint8_t index)
{
    // 如果索引没有变化，不做任何操作
    if(index == menu->current_offset) return;

    // 如果新索引大于当前索引，表示需要向下移动
    if(index > menu->current_offset){
        // 如果当前动画步长为负，改为正值
        if(menu->animation_holder->y_step < 0){
            menu->animation_holder->y_step = 
                -menu->animation_holder->y_step;
        }
    }
    // 如果新索引小于当前索引，表示需要向上移动
    else{
        // 如果当前动画步长为正，改为负值
        if(menu->animation_holder->y_step > 0){
            menu->animation_holder->y_step = 
                -menu->animation_holder->y_step;
        }
    }
    // 更新当前菜单项的索引
    menu->current_offset = index;
    // 计算目标位置
    CCGraphic_Point end_tlp;
    end_tlp = menu->animation_holder->tl_point; 
    end_tlp.y = index * menu->animation_holder->animationOffsetSize.height;
    // 如果启用了动画，执行逐步动画
    if(menu->enabled_animations)
        __pvt_do_stepped_animate(menu->animation_holder, &end_tlp);
    else
        // 否则，立即执行动画
        __pvt_do_as_immediate(menu->animation_holder, &end_tlp);
}

// 进入子菜单并显示子菜单的内容
static CCGraphic_Menu* __pvt_enterSub(CCGraphic_Menu* parentMenu)
{
    // 缓存父菜单的图标状态
    uint8_t cached_icon_state = parentMenu->icon_state;
    // 获取父菜单的子菜单
    CCGraphic_Menu* subone = __pvt_current_owns_subMenu(parentMenu);
    // 如果没有子菜单，返回NULL
    if(!subone) return NULL;
    // 隐藏当前菜单
    parentMenu->operations.common.hide(parentMenu);
    // 恢复父菜单的图标状态
    parentMenu->icon_state = cached_icon_state;
    // 如果子菜单有图标，显示图标，否则显示子菜单
    if(subone->icon_state){
        subone->operations.showIcon(subone);
    }else{
        subone->operations.common.show(subone);
    }
    // 返回子菜单
    return subone;
}

// 返回父菜单并显示父菜单的内容
static CCGraphic_Menu* __pvt_backParent(CCGraphic_Menu* subMenu)
{
    // 缓存子菜单的图标状态
    uint8_t cached_icon_state = subMenu->icon_state;
    // 获取子菜单的父菜单
    CCGraphic_Menu* parentMenu = __pvt_owns_parent_current(subMenu);
    // 如果没有父菜单，返回NULL
    if(!parentMenu) return NULL;
    // 隐藏当前子菜单
    subMenu->operations.common.hide(subMenu);
    // 恢复子菜单的图标状态
    subMenu->icon_state = cached_icon_state;
    // 如果父菜单有图标，显示图标，否则显示父菜单
    if(parentMenu->icon_state){
        parentMenu->operations.showIcon(parentMenu);
    }else{
        parentMenu->operations.common.show(parentMenu);
    }
    
    // 返回父菜单
    return parentMenu;
}
```

## 完整的测试文件

​现在来看看完整的测试文件！

```text
#include "Test/OLED_TEST/oled_test.h"
#include "Test/GraphicTest/graphic_test.h"
#include "Graphic/widgets/components/CCGraphic_TextEdit/CCGraphic_TextEdit.h"
void test_oled_iic_functionalities()
{
    OLED_Handle handle;
    user_init_hard_iic_oled_handle(&handle);
    test_set_pixel_line(&handle, 1, 2);
    HAL_Delay(1000);
    test_clear(&handle);
    test_set_pixel_line(&handle, 2, 1);
    HAL_Delay(1000);
    test_clear(&handle);
}

void test_oled_spi_functionalities()
{
    OLED_Handle handle;
    user_init_hard_spi_oled_handle(&handle);
    test_set_pixel_line(&handle, 1, 2);
    HAL_Delay(1000);
    test_clear(&handle);
    test_set_pixel_line(&handle, 2, 1);
    HAL_Delay(1000);
    test_clear(&handle);
}

static void __helper_on_set_text(CCGraphicTextEdit* edit, char* sources, uint32_t shown_time)
{
    edit->operations.setText(edit, sources);
    HAL_Delay(shown_time * 1000);
    edit->operations.clear(edit);
}

#define SET_TEXT_CONV(SRC, SECS) do{ sources = SRC;\
    __helper_on_set_text(&edit, sources, SECS);}while(0)

static void __test_common(CCDeviceHandler* handler)
{
    CCGraphicTextEdit   edit;
    CCGraphic_AsciiTextItem item;
    CCGraphic_Point p;
    p.x = 0;
    p.y = 0;
    CCGraphic_Size acceptablesize = 
        CCGraphicWidget_MaxAcceptable_Size(handler);
    CCGraphicWidget_init_AsciiTextItem(
        &item, p, acceptablesize, ASCII_6x8
    );
    CCGraphic_init_CCGraphicTextEdit(
        &edit, handler, &item
    );
    edit.acquired_stepped_update = 1;
    char* sources;
    SET_TEXT_CONV("Hello! Welcome CCGraphic SimpleTest!", 5);
    SET_TEXT_CONV("If you see this sentences, "
    "it means that you have passed the GraphicTest"
    "and congratulations!", 7);

    SET_TEXT_CONV("Graphic Test On Base begin", 4);
    SET_TEXT_CONV("Test Points", 4);
    on_test_draw_points(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Lines", 4);
    on_test_draw_line(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Circles", 4);
    on_test_draw_circle(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Rectangle", 4);
    on_test_draw_rectangle(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Triangle", 4);
    on_test_draw_triangle(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Ellipse", 4);
    on_test_draw_ellipse(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Arc", 4);
    on_test_draw_arc(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Graphic Test On Base end", 4);
    SET_TEXT_CONV("Graphic Test On widget begin", 4);
    SET_TEXT_CONV("Test Image Drawing", 4);

    /* widget test */
    on_test_draw_image(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Ascii Draw", 4);
    on_test_draw_ascii(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Graphic Test On widget end", 4);
    SET_TEXT_CONV("Graphic Test On component begin", 4);
    SET_TEXT_CONV("Test TextEdit", 4);
    /* components test */
    on_test_component_textEdit_test(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Frame", 4);
    on_test_component_frame_test(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Test Menu", 4);
    on_test_component_menu(handler);
    HAL_Delay(1000);
    SET_TEXT_CONV("Graphic Test On component end", 4);
    SET_TEXT_CONV("Finish Testing, enjoy!", 4);
}

void test_graphic_hardiic_functionalities()
{
    CCDeviceHandler handler;
    on_test_init_hardiic_oled(&handler);

    __test_common(&handler);
}

void test_graphic_soft_spi_functionalities()
{
    CCDeviceHandler handler;
    on_test_init_softspi_oled(&handler);

    __test_common(&handler);
}

void test_graphic_hard_spi_functionalities()
{
    CCDeviceHandler handler;
    on_test_init_hardspi_oled(&handler);

    __test_common(&handler);
}
```

