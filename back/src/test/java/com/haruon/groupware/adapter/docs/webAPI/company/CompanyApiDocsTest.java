package com.haruon.groupware.adapter.docs.webAPI.company;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.company.CompanyApi;
import com.haruon.groupware.application.company.provided.CompanyRetriever;

import static org.mockito.Mockito.mock;

public class CompanyApiDocsTest extends RestDocsSupport {

    private final CompanyRetriever companyRetriever = mock(CompanyRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/company";

    @Override
    protected Object initController() {
        return new CompanyApi(companyRetriever);
    }
}
