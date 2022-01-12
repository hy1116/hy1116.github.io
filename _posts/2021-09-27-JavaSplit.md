---
title : "Java - Split "
category : "Java"
tages : [Java]
date : 2021-09-27T18:00:00
last_modified_at: 2021-09-27T18:00:00
---

## Split

### 개행문자

```java
public void main(String[] args){
    String str = "10001 \n10002 \n10003";
    String[] strArr = str.split("\\n");
    
    for(String str : strArr){
        System.out.println(str);
    }
    
    /*
    10001
    10002
    10003
    */
}
```



---

**references**