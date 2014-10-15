# 追踪者（stalker）项目nginx日志解析工具：stalker

## 安装
```bash
npm install stalker-parser
```

## 命令
```bash
# 遍历
stalker walk nginx/log
# 入库
stalker insertdb nginx/log
# 导出csv文件
stalker csv nginx/log
```
## 配置
创建`config.json`，格式如下：
```
{
    "database": {
        "connectionLimit": 10,
        "host": "localhost",
        "port": 3306,
        "user": "root",
        "passord": "",
        "database": "tracker",
        "table": "test"
    },
    "database_timeout": 10000,
    "fileds_order_map": {
        "feature": ["id", "product_id", "ip", "access_time", "user_agent", "os_name", "os_version", "browser_name", "browser_version", "device_name", "device_version", "os_fullversion", "browser_fullversion", "device_fullversion", "screen", "device_pixel_ratio"],
        "hijack": [],
        "badjs": []
    },
    "query_map": {
        "hijack": {},
        "badjs": {},
        "feature": {}
    }
}
```
执行：
```
# 如果config.json在执行目录下
stalker insertdb nginx/log
# OR
stalker insertdb nginx/log -c config/path
```
