import { paths } from "../__generated__/petstore";
import { tsoapy } from "../";

const client = tsoapy<paths>(new URL("https://example.com/api/petstore"));

// a set of async examples
async function examples() {
  const r1 = await client
    .path("/store/order")
    .method("post")
    .body({
      id: 123,
      petId: 456,
      quantity: 1,
      shipDate: "2023-02-25T00:00:00Z",
      status: "placed",
      complete: false,
    })
    .send();
  if (r1.status === 200) {
    r1.data.id; // number | undefined
  } else {
    // r1.data.id;
    //    ~~~~ error, !200 does not contain data
  }

  const r2 = await client
    .path("/pet/findByStatus")
    .method("get")
    .query({
      status: "available",
    })
    .send<"application/xml">();
  if (r1.status === 200) {
    r1.data.id; // number | undefined
  } else {
    // no data
  }

  const r3 = await client
    .path("/pet")
    .method("put", "application/xml", (data) => {
      // a hypothetical JSON to XML transformer
      return `<xml>...</xml>`;
    })
    .body({
      id: 9876,
      name: "Skippy",
      photoUrls: [],
    })
    .send({}, "application/xml", (t, code) => {
      // you must serialize for all responses, so this will not work
      // return {
      //   status: code
      // };

      // a hypotnetical XML to JSON transformer
      if (code === 200) {
        return {
          status: code,
          data: {
            name: "Skippy The Magnificent",
            photoUrls: [],
          },
        };
      }
      // TS will catch this
      // else if (code === 999) {
      //   return {
      //     id: 1234
      //   }
      // }
      else {
        return {
          status: code,
        };
      }

      // if you do not deserialize for all codes, you will create
      // a type error, as every return value must conform with the valid
      // return types provided in the OpenAPI typings
    });

  const r4 = await client
    .path("/pet/{petId}")
    .method("get")
    .params({ petId: 12345 })
    .send();
}

export default {};
