import { paths } from "../__generated__/petstore";
import { tsoapy } from "../";

const client = tsoapy<paths>(new URL("https://example.com/api/petstore"));

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
    r1.data.id; // <= from response
  } else {
    r1.data;
  }

  const r2 = await client
    .path("/pet/findByStatus")
    .method("get")
    .query({
      status: "available",
    })
    .send<"application/xml">();
  if (r1.status === 200) {
    r1.data.id; // <= from response
  } else {
    r1.data;
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
      // a hypotnetical XML to JSON transformer
      return {
        name: "Skippy The Magnificent",
        photoUrls: [],
      };
    });

  const r4 = await client
    .path("/pet/{petId}")
    .method("get")
    .params({ petId: 12345 })
    .send();
}

export default {};
